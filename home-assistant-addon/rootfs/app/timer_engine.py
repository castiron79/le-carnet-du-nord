"""Durable, server-owned recipe timers. No browser or HA events drive expiry."""
import hashlib
import json
import math
import re
import sqlite3
import threading
import time
import uuid
from contextlib import contextmanager

MAX_SECONDS = 86400
LIMIT = 128
RETENTION = 30 * 86400
ID = re.compile(r"[a-zA-Z0-9_-]{8,100}")


class TimerError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def adjust(seconds, increase):
    low = seconds < 120 if increase else seconds <= 120
    middle = seconds < 300 if increase else seconds <= 300
    delta = 10 if low else 30 if middle else 60
    boundary = (120 if low else 300 if middle else MAX_SECONDS) if increase else (10 if low else 120 if middle else 300)
    value = min(boundary, seconds + delta) if increase else max(boundary, seconds - delta)
    return max(10, min(MAX_SECONDS, value))


class TimerEngine:
    def __init__(self, path, definitions, wall=time.time, mono=time.monotonic):
        self.path, self.definitions, self.wall, self.mono = path, definitions, wall, mono
        self.lock = threading.RLock()
        self.wake, self.shutdown = threading.Event(), threading.Event()
        self.threads = []
        self.error = None
        self.last_tick = None
        self.last_delivery = None
        self.monotonic_deadlines = {}
        self.clock_offset = self.wall() - self.mono()
        with self.transaction() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS carnet_timer_schema (version INTEGER PRIMARY KEY);
                INSERT OR IGNORE INTO carnet_timer_schema VALUES (1);
                CREATE TABLE IF NOT EXISTS carnet_timers (
                  key TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, timer_id TEXT NOT NULL,
                  initial INTEGER NOT NULL, title TEXT NOT NULL, label TEXT NOT NULL, step INTEGER NOT NULL,
                  run_id TEXT NOT NULL, status TEXT NOT NULL, seconds INTEGER NOT NULL,
                  deadline REAL, revision INTEGER NOT NULL, updated REAL NOT NULL, alarm_id TEXT);
                CREATE TABLE IF NOT EXISTS carnet_alarms (
                  id TEXT PRIMARY KEY, created REAL NOT NULL, until_at REAL NOT NULL,
                  status TEXT NOT NULL, attempted REAL, result TEXT NOT NULL DEFAULT '{}',
                  stop_requested INTEGER NOT NULL DEFAULT 0, notified INTEGER NOT NULL DEFAULT 0);
                CREATE TABLE IF NOT EXISTS carnet_expiries (
                  run_id TEXT PRIMARY KEY, timer_key TEXT NOT NULL, expired REAL NOT NULL,
                  alarm_id TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS carnet_requests (
                  id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, response TEXT NOT NULL, created REAL NOT NULL);
                CREATE INDEX IF NOT EXISTS carnet_due ON carnet_timers(status,deadline);
            """)
            # An interrupted dispatch must never be retried blindly after process death.
            db.execute("UPDATE carnet_alarms SET status='interrupted',stop_requested=1 WHERE status IN ('dispatching','active')")
        self.tick()

    @contextmanager
    def transaction(self):
        with self.lock:
            db = sqlite3.connect(self.path, timeout=10)
            db.row_factory = sqlite3.Row
            try:
                db.execute("PRAGMA journal_mode=WAL")
                db.execute("PRAGMA synchronous=FULL")
                db.execute("BEGIN IMMEDIATE")
                yield db
                db.commit()
            except BaseException:
                db.rollback()
                raise
            finally:
                db.close()

    def _normalise_clock(self, db, now):
        monotonic = self.mono()
        changed = abs((now - monotonic) - self.clock_offset) > 1
        running = db.execute("SELECT key,deadline FROM carnet_timers WHERE status='running'").fetchall()
        current = {r['key'] for r in running}
        for key in list(self.monotonic_deadlines):
            if key not in current:
                del self.monotonic_deadlines[key]
        for row in running:
            key = row['key']
            if key not in self.monotonic_deadlines:
                self.monotonic_deadlines[key] = monotonic + row['deadline'] - now
            elif changed:
                deadline = now + self.monotonic_deadlines[key] - monotonic
                db.execute("UPDATE carnet_timers SET deadline=?,revision=revision+1 WHERE key=?", (deadline, key))
        self.clock_offset = now - monotonic

    def _expire(self, db, now):
        db.execute("UPDATE carnet_alarms SET status='missed' WHERE status='pending' AND created<?", (now-60,))
        db.execute("UPDATE carnet_alarms SET stop_requested=1 WHERE status IN ('active','dispatching') AND until_at<=?", (now,))
        for row in db.execute("SELECT * FROM carnet_timers WHERE status='running' AND deadline<=? ORDER BY deadline,key", (now,)).fetchall():
            # One fixed window, no extension by later expiries. Pending windows cannot queue forever.
            alarm = db.execute("SELECT * FROM carnet_alarms WHERE status IN ('pending','dispatching','active') AND stop_requested=0 AND until_at>? ORDER BY created LIMIT 1", (now,)).fetchone()
            if alarm is None:
                alarm_id = uuid.uuid4().hex
                missed = now - row['deadline'] > 60
                db.execute("INSERT INTO carnet_alarms(id,created,until_at,status) VALUES(?,?,?,?)", (alarm_id, row['deadline'], now if missed else now + 60, 'missed' if missed else 'pending'))
            else:
                alarm_id = alarm['id']
            db.execute("INSERT OR IGNORE INTO carnet_expiries VALUES(?,?,?,?)", (row['run_id'], row['key'], row['deadline'], alarm_id))
            db.execute("UPDATE carnet_timers SET status='done',seconds=0,deadline=NULL,revision=revision+1,updated=?,alarm_id=? WHERE key=?", (now, alarm_id, row['key']))
            self.monotonic_deadlines.pop(row['key'], None)
        # Never send an old pending alarm after its recovery budget has elapsed.
        db.execute("UPDATE carnet_alarms SET status='missed' WHERE status='pending' AND created<?", (now-60,))

    def tick(self):
        now = self.wall()
        with self.transaction() as db:
            self._normalise_clock(db, now)
            self._expire(db, now)
            db.execute("DELETE FROM carnet_requests WHERE created<?", (now-RETENTION,))
            db.execute("DELETE FROM carnet_timers WHERE status IN ('ready','done','cancelled') AND updated<?", (now-RETENTION,))
            db.execute("DELETE FROM carnet_expiries WHERE expired<? AND alarm_id IN (SELECT id FROM carnet_alarms WHERE status IN ('stopped','missed','failed','interrupted'))", (now-RETENTION,))
            db.execute("DELETE FROM carnet_alarms WHERE created<? AND status IN ('stopped','missed','failed','interrupted') AND notified=1", (now-RETENTION,))
        self.last_tick, self.error = self.mono(), None

    @staticmethod
    def key(recipe_id, timer_id, initial):
        return f"{recipe_id}:{timer_id}:{initial}"

    def view(self):
        now = self.wall()
        with self.transaction() as db:
            timers = [dict(r) for r in db.execute("SELECT * FROM carnet_timers ORDER BY updated DESC")]
            alarms = [dict(r) for r in db.execute("SELECT * FROM carnet_alarms WHERE status IN ('pending','dispatching','active') OR stop_requested=1 ORDER BY created DESC LIMIT 16")]
        for row in timers:
            row['remaining'] = max(0, math.ceil(row['deadline']-now)) if row['status']=='running' else row['seconds']
        for alarm in alarms:
            alarm['result'] = json.loads(alarm['result'])
        return {'server_time': now, 'timers': timers, 'alarms': alarms, 'health': self.health()}

    def request_result(self, request_id):
        if not ID.fullmatch(request_id):
            raise TimerError('Ogiltigt begärande-ID')
        with self.transaction() as db:
            row = db.execute('SELECT response FROM carnet_requests WHERE id=?', (request_id,)).fetchone()
        return {'found': bool(row), 'result': json.loads(row['response']) if row else None}

    def health(self):
        running = bool(self.threads) and not self.shutdown.is_set() and all(t.is_alive() for t in self.threads)
        return {'ok': running and self.error is None and self.last_tick is not None and self.mono()-self.last_tick<5,
                'error': 'Timerdriften behöver kontrolleras' if self.error else None,
                'delivery': self.last_delivery}

    def change(self, data):
        if not isinstance(data, dict):
            raise TimerError('JSON-objekt krävs')
        request_id = data.get('request_id', '')
        revision = data.get('revision')
        if not isinstance(request_id, str) or not ID.fullmatch(request_id) or type(revision) is not int or revision < 0:
            raise TimerError('Ogiltigt begärande-ID eller revision')
        fingerprint = hashlib.sha256(json.dumps(data, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        now = self.wall()
        with self.transaction() as db:
            old = db.execute("SELECT * FROM carnet_requests WHERE id=?", (request_id,)).fetchone()
            if old:
                if old['fingerprint'] != fingerprint:
                    raise TimerError('Begärande-ID har redan använts med annat innehåll', 409)
                return json.loads(old['response'])
            if db.execute('SELECT count(*) FROM carnet_requests WHERE created>?', (now-60,)).fetchone()[0] >= 128:
                raise TimerError('För många timerkommandon. Vänta en stund.', 429)
            self._normalise_clock(db, now)
            self._expire(db, now)
            action = data.get('action')
            if action == 'stop_alarm':
                alarm_id = data.get('alarm_id')
                if not isinstance(alarm_id, str) or not ID.fullmatch(alarm_id):
                    raise TimerError('Ogiltigt larm-ID')
                db.execute("UPDATE carnet_alarms SET stop_requested=1 WHERE id=? AND status IN ('pending','dispatching','active')", (alarm_id,))
            elif action in ('start', 'pause', 'plus', 'minus', 'reset', 'cancel'):
                key = data.get('key')
                if not isinstance(key, str) or len(key)>260:
                    raise TimerError('Ogiltig timer')
                row = db.execute("SELECT * FROM carnet_timers WHERE key=?", (key,)).fetchone()
                if row is None:
                    definition = self.definitions(key)
                    if definition is None:
                        raise TimerError('Recepttimern finns inte längre', 404)
                    if revision != 0:
                        raise TimerError('Timern har ändrats. Läs aktuell status.', 409)
                    previous = db.execute("SELECT key FROM carnet_timers WHERE recipe_id=? AND timer_id=? AND status IN ('running','paused')", (definition['recipe_id'],definition['timer_id'])).fetchone()
                    if previous:
                        raise TimerError('En äldre version av denna timer pågår. Avsluta den i timeröversikten först.', 409)
                    db.execute("INSERT INTO carnet_timers VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (key,definition['recipe_id'],definition['timer_id'],definition['initial'],definition['title'],definition['label'],definition['step'],uuid.uuid4().hex,'ready',definition['initial'],None,0,now,None))
                    row = db.execute("SELECT * FROM carnet_timers WHERE key=?", (key,)).fetchone()
                if row['revision'] != revision:
                    raise TimerError('Timern har ändrats. Läs aktuell status.', 409)
                state, seconds = row['status'], row['seconds']
                deadline, run_id, alarm_id = row['deadline'], row['run_id'], row['alarm_id']
                remaining = max(0, math.ceil(deadline-now)) if state == 'running' else seconds
                if action in ('reset','cancel'):
                    state, seconds, deadline, alarm_id = 'ready', row['initial'], None, None
                    run_id = uuid.uuid4().hex
                elif state == 'done':
                    raise TimerError('Återställ den färdiga timern först', 409)
                elif action == 'start' and state != 'running':
                    if state != 'paused' and db.execute("SELECT count(*) FROM carnet_timers WHERE status IN ('running','paused')").fetchone()[0] >= LIMIT:
                        raise TimerError('För många aktiva timers', 429)
                    state, deadline = 'running', now+remaining
                elif action == 'pause' and state == 'running':
                    state, seconds, deadline = 'paused', remaining, None
                elif action in ('plus','minus'):
                    seconds = adjust(remaining, action=='plus')
                    deadline = now+seconds if state=='running' else None
                db.execute("UPDATE carnet_timers SET run_id=?,status=?,seconds=?,deadline=?,revision=revision+1,updated=?,alarm_id=? WHERE key=?", (run_id,state,seconds,deadline,now,alarm_id,key))
                if state == 'running':
                    self.monotonic_deadlines[key] = self.mono()+deadline-now
                else:
                    self.monotonic_deadlines.pop(key, None)
            else:
                raise TimerError('Ogiltig timeråtgärd')
            result = {'ok': True, 'request_id': request_id}
            db.execute("INSERT INTO carnet_requests VALUES(?,?,?,?)", (request_id,fingerprint,json.dumps(result),now))
        self.wake.set()
        return result

    def _deliver_once(self, bridge):
        now = self.wall()
        with self.transaction() as db:
            stop = db.execute("SELECT * FROM carnet_alarms WHERE stop_requested=1 ORDER BY created LIMIT 1").fetchone()
        if stop:
            result = bridge.stop(stop['id'])
            with self.transaction() as db:
                combined = {**json.loads(stop['result']), 'stop': result}
                state = 'interrupted' if stop['status']=='interrupted' else 'stopped'
                db.execute("UPDATE carnet_alarms SET status=?,stop_requested=0,result=? WHERE id=?", (state,json.dumps(combined),stop['id']))
            return
        with self.transaction() as db:
            row = db.execute("SELECT * FROM carnet_alarms WHERE status='pending' AND stop_requested=0 ORDER BY created LIMIT 1").fetchone()
        if row:
            # A read-only preflight may be retried; a dispatched command never is.
            if not bridge.ready():
                self.last_delivery = 'Larmkontrollen är inte redo'
                return
            with self.transaction() as db:
                live = db.execute("SELECT * FROM carnet_alarms WHERE id=?", (row['id'],)).fetchone()
                if live['status'] != 'pending' or live['stop_requested']:
                    return
                until_at = now+30
                if now>live['created']+60:
                    db.execute("UPDATE carnet_alarms SET status='missed' WHERE id=?", (row['id'],))
                    return
                db.execute("UPDATE carnet_alarms SET status='dispatching',attempted=?,until_at=? WHERE id=?", (now,until_at,row['id']))
            try:
                result = bridge.start(row['id'],until_at)
                delivery_status = 'active'
            except (OSError, ValueError, RuntimeError):
                result, delivery_status = {'error': 'Osäker larmleverans; spelas inte om'}, 'interrupted'
            with self.transaction() as db:
                db.execute("UPDATE carnet_alarms SET status=?,result=?,stop_requested=max(stop_requested,?) WHERE id=?", (delivery_status,json.dumps(result),int(delivery_status=='interrupted'),row['id']))
            self.last_delivery = delivery_status
            return
        with self.transaction() as db:
            active = db.execute("SELECT * FROM carnet_alarms WHERE status='active' LIMIT 1").fetchone()
        if active and not bridge.active(active['id']):
            with self.transaction() as db:
                db.execute("UPDATE carnet_alarms SET status='stopped' WHERE id=?", (active['id'],))
        with self.transaction() as db:
            failed = db.execute("SELECT * FROM carnet_alarms WHERE status IN ('missed','interrupted','failed') AND notified=0 LIMIT 1").fetchone()
        if failed:
            bridge.notify(failed['id'],failed['status'])
            with self.transaction() as db:
                db.execute("UPDATE carnet_alarms SET notified=1 WHERE id=?", (failed['id'],))

    def start(self, bridge):
        if self.threads:
            raise RuntimeError('Timerdriften är redan startad')

        def scheduler():
            while not self.shutdown.is_set():
                try:
                    self.tick()
                except (OSError, sqlite3.Error, ValueError):
                    self.error = 'scheduler'
                self.wake.wait(0.5)
                self.wake.clear()

        def delivery():
            while not self.shutdown.is_set():
                try:
                    self._deliver_once(bridge)
                except (OSError, sqlite3.Error, ValueError, RuntimeError):
                    self.last_delivery = 'Larmanslutningen behöver kontrolleras'
                self.shutdown.wait(0.5)

        self.threads = [threading.Thread(target=scheduler,daemon=True,name='carnet-timers'),threading.Thread(target=delivery,daemon=True,name='carnet-alarms')]
        for thread in self.threads:
            thread.start()

    def close(self):
        self.shutdown.set()
        self.wake.set()
        for thread in self.threads:
            thread.join(timeout=20)
