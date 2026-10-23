import concurrent.futures
import importlib.util
import sqlite3
import tempfile
import threading
import time
import unittest
from contextlib import closing
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / 'home-assistant-addon/rootfs/app/timer_engine.py'
spec = importlib.util.spec_from_file_location('carnet_engine_tests', SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Clock:
    wall_time, mono_time = 1000000.0, 1000.0

    def advance(self, seconds):
        self.wall_time += seconds
        self.mono_time += seconds


class Bridge:
    def __init__(self):
        self.starts, self.stops, self.notifications = [], [], []
        self.available = True
        self.current = None

    def ready(self): return self.available
    def active(self, alarm_id): return self.current == alarm_id
    def start(self, alarm_id, until_at):
        self.starts.append((alarm_id, until_at))
        self.current = alarm_id
        return {'speakers': {'nest': 'observed', 'mini': 'observed'}}
    def stop(self, alarm_id):
        self.stops.append(alarm_id)
        if self.current == alarm_id: self.current = None
        return {'stopped': True}
    def notify(self, alarm_id, status): self.notifications.append((alarm_id,status))


class TimerEngineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'timers.db'
        self.clock, self.bridge = Clock(), Bridge()
        self.definitions = {}
        for n, seconds in enumerate([10, 20, 120, 300, 600]):
            key = f'recipe:timer-{n}:{seconds}'
            self.definitions[key] = {'recipe_id':'recipe','timer_id':f'timer-{n}', 'initial':seconds,'title':'Recept','label':f'Timer {n}','step':n+1}
        self.count = 0
        self.engine = self.open()

    def open(self):
        return module.TimerEngine(self.path, self.definitions.get, wall=lambda:self.clock.wall_time, mono=lambda:self.clock.mono_time)

    def action(self, action, index=0, **extra):
        key = list(self.definitions)[index]
        row = next((r for r in self.engine.view()['timers'] if r['key']==key), None)
        self.count += 1
        data = {'action':action,'key':key,'revision':row['revision'] if row else 0,'request_id':f'request-{self.count:06}'}
        data.update(extra)
        return self.engine.change(data)

    def row(self, index=0):
        return next(r for r in self.engine.view()['timers'] if r['key']==list(self.definitions)[index])

    def test_start_pause_resume_reset_and_cancel(self):
        self.action('start',4)
        self.clock.advance(23)
        self.action('pause',4)
        self.assertEqual(self.row(4)['seconds'],577)
        self.clock.advance(90)
        self.assertEqual(self.row(4)['remaining'],577)
        self.action('start',4)
        self.assertEqual(self.row(4)['deadline'],self.clock.wall_time+577)
        self.action('cancel',4)
        self.clock.advance(600)
        self.engine.tick()
        self.assertEqual(self.row(4)['status'],'ready')
        self.assertEqual(self.row(4)['remaining'],600)
        self.assertFalse(self.engine.view()['alarms'])

    def test_boundary_adjustments_match_existing_contract(self):
        self.assertEqual([module.adjust(120,False),module.adjust(120,True),module.adjust(300,False),module.adjust(300,True)],[110,150,270,360])
        self.assertEqual(module.adjust(10,False),10)
        self.assertEqual(module.adjust(86400,True),86400)
        self.action('start',4)
        self.clock.advance(2.3)
        self.action('minus',4)
        self.assertEqual(self.row(4)['remaining'],538)

    def test_expiry_persisted_once_without_any_browser(self):
        self.action('start')
        self.clock.advance(10)
        for _ in range(3): self.engine.tick()
        self.assertEqual(self.row()['status'],'done')
        with closing(sqlite3.connect(self.path)) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM carnet_expiries').fetchone()[0],1)
        self.engine._deliver_once(self.bridge)
        self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.starts),1)

    def test_request_replay_and_payload_collision(self):
        request = {'action':'start','key':list(self.definitions)[0],'revision':0,'request_id':'same-request'}
        result = self.engine.change(request)
        deadline = self.row()['deadline']
        self.clock.advance(2)
        self.assertEqual(self.engine.change(request),result)
        self.assertEqual(self.row()['deadline'],deadline)
        with self.assertRaises(module.TimerError): self.engine.change({**request,'action':'pause'})

    def test_concurrent_start_has_one_winner(self):
        key = list(self.definitions)[0]
        def call(n):
            try:
                self.engine.change({'action':'start','key':key,'revision':0,'request_id':f'parallel-{n}'})
                return True
            except module.TimerError: return False
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            self.assertEqual(sum(pool.map(call,range(4))),1)

    def test_running_start_is_idempotent(self):
        self.action('start',4)
        deadline = self.row(4)['deadline']
        self.clock.advance(10)
        self.action('start',4)
        self.assertEqual(self.row(4)['deadline'],deadline)

    def test_restart_preserves_running_and_paused_timers(self):
        self.action('start',4)
        self.action('start',3)
        self.clock.advance(5)
        self.action('pause',3)
        self.engine = self.open()
        self.assertEqual(self.row(4)['remaining'],595)
        self.assertEqual(self.row(3)['remaining'],295)

    def test_recent_missed_timer_recovers_old_timer_stays_silent(self):
        self.action('start')
        self.clock.advance(20)
        self.engine = self.open()
        self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.starts),1)
        self.action('start',1)
        self.clock.advance(100)
        self.engine = self.open()
        self.engine._deliver_once(self.bridge)  # cleanup interrupted old alarm
        self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.starts),1)

    def test_overlapping_expiries_join_without_extending_window(self):
        self.action('start')
        self.action('start',1)
        self.clock.advance(10)
        self.engine.tick()
        self.engine._deliver_once(self.bridge)
        until_at = self.engine.view()['alarms'][0]['until_at']
        self.clock.advance(10)
        self.engine.tick()
        self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.starts),1)
        self.assertEqual(self.row()['alarm_id'],self.row(1)['alarm_id'])
        self.assertEqual(self.engine.view()['alarms'][0]['until_at'],until_at)

    def test_stop_is_scoped_and_other_timer_continues(self):
        self.action('start')
        self.action('start',4)
        self.clock.advance(10)
        self.engine.tick()
        self.engine._deliver_once(self.bridge)
        alarm_id = self.row()['alarm_id']
        self.action('stop_alarm',alarm_id=alarm_id)
        self.engine._deliver_once(self.bridge)
        self.assertEqual(self.bridge.stops,[alarm_id])
        self.assertEqual(self.row(4)['status'],'running')
        self.action('start',1)
        self.clock.advance(20)
        self.engine.tick()
        self.engine._deliver_once(self.bridge)
        self.action('stop_alarm',alarm_id=alarm_id)
        self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.stops),1)

    def test_auto_stop_and_uncertain_dispatch_never_replayed(self):
        self.action('start')
        self.clock.advance(10)
        self.engine.tick()
        self.engine._deliver_once(self.bridge)
        self.clock.advance(30)
        self.engine.tick()
        self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.stops),1)
        self.action('reset')
        self.action('start')
        self.clock.advance(10)
        self.engine.tick()
        with self.engine.transaction() as db: db.execute("UPDATE carnet_alarms SET status='dispatching' WHERE status='pending'")
        self.engine = self.open()
        for _ in range(3): self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.starts),1)

    def test_clock_jumps_do_not_change_running_duration(self):
        self.action('start',4)
        self.clock.advance(10)
        self.clock.wall_time += 3600
        self.engine.tick()
        self.assertEqual(self.row(4)['remaining'],590)
        self.clock.wall_time -= 7200
        self.engine.tick()
        self.assertEqual(self.row(4)['remaining'],590)

    def test_definition_removal_does_not_remove_existing_timer(self):
        self.action('start',4)
        self.definitions.clear()
        self.engine.change({'action':'pause','key':self.engine.view()['timers'][0]['key'],'revision':1,'request_id':'pause-orphan'})
        self.assertEqual(self.engine.view()['timers'][0]['status'],'paused')

    def test_unavailable_ha_recovers_only_inside_budget(self):
        self.action('start')
        self.clock.advance(10)
        self.engine.tick()
        self.bridge.available=False
        self.engine._deliver_once(self.bridge)
        self.clock.advance(40)
        self.engine.tick()
        self.bridge.available=True
        self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.starts),1)
        self.assertEqual(self.bridge.starts[0][1],self.clock.wall_time+30)

    def test_uncertain_network_response_is_not_retried(self):
        self.action('start')
        self.clock.advance(10)
        self.engine.tick()
        def uncertain(alarm_id,until_at):
            self.bridge.starts.append((alarm_id,until_at))
            raise OSError('connection lost after acceptance')
        self.bridge.start=uncertain
        for _ in range(4): self.engine._deliver_once(self.bridge)
        self.assertEqual(len(self.bridge.starts),1)
        self.assertEqual(len(self.bridge.stops),1)
        self.assertEqual(len(self.bridge.notifications),1)

    def test_updated_definition_cannot_duplicate_active_step(self):
        self.action('start',4)
        self.definitions['recipe:timer-4:700']={**list(self.definitions.values())[4],'initial':700}
        with self.assertRaises(module.TimerError):
            self.engine.change({'action':'start','key':'recipe:timer-4:700','revision':0,'request_id':'changed-definition'})
        self.assertEqual(self.row(4)['status'],'running')

    def test_request_lookup_survives_restart(self):
        self.action('start',4)
        self.engine=self.open()
        self.assertTrue(self.engine.request_result('request-000001')['found'])
        self.assertFalse(self.engine.request_result('not-a-known-id')['found'])

    def test_retention_does_not_delete_paused_timer(self):
        self.action('start',4)
        self.action('pause',4)
        self.clock.advance(31*86400)
        self.engine.tick()
        self.assertEqual(self.row(4)['status'],'paused')

    def test_invalid_input_and_stale_revision_rejected(self):
        for data in (None, {}, {'revision':True,'request_id':'valid-request'}, {'action':'arbitrary-ha','revision':0,'request_id':'valid-request'}):
            with self.assertRaises(module.TimerError): self.engine.change(data)
        self.action('start')
        with self.assertRaises(module.TimerError): self.action('pause',revision=0)

    def test_real_worker_runs_without_request_or_open_page(self):
        engine = module.TimerEngine(self.path, self.definitions.get)
        self.addCleanup(engine.close)
        engine.start(self.bridge)
        engine.change({'action':'start','key':list(self.definitions)[0],'revision':0,'request_id':'worker-start'})
        with engine.transaction() as db: db.execute("UPDATE carnet_timers SET deadline=?", (time.time()-1,))
        engine.monotonic_deadlines.clear()
        engine.wake.set()
        limit = time.monotonic()+3
        while not self.bridge.starts and time.monotonic()<limit: threading.Event().wait(0.02)
        self.assertEqual(len(self.bridge.starts),1)
        self.assertTrue(engine.health()['ok'])


if __name__ == '__main__': unittest.main()
