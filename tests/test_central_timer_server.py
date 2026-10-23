import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch
import test_ingress_server as ingress


class CentralTimerServerTests(unittest.TestCase):
    setUp = ingress.IngressServerTests.setUp
    serve = ingress.IngressServerTests.serve
    request = ingress.IngressServerTests.request

    def enable(self):
        definitions={'recipe:test:10':{'recipe_id':'recipe','timer_id':'test','initial':10,'title':'Test','label':'Koka','step':1}}
        self.engine=self.app.TimerEngine(self.app.DB,definitions.get)
        self.app.TIMER_ENGINE=self.engine
        self.addCleanup(self.engine.close)

    def test_routes_persist_commands_and_request_result(self):
        self.enable()
        port=self.serve('172.30.32.2')
        data={'key':'recipe:test:10','action':'start','revision':0,'request_id':'test-request-123'}
        headers={'Content-Type':'application/json','X-Carnet-Request':'1'}
        self.assertEqual(self.request(port,'POST','/api/timers',body=json.dumps(data))[0],403)
        self.assertEqual(self.request(port,'POST','/api/timers',headers,json.dumps(data))[0],200)
        status,body,_=self.request(port,'GET','/api/timer-requests/test-request-123')
        self.assertEqual(status,200)
        self.assertTrue(json.loads(body)['found'])
        view=json.loads(self.request(port,'GET','/api/timers')[1])
        self.assertEqual(view['timers'][0]['status'],'running')
        self.assertEqual(len(view['timers']),1)
        self.assertEqual(self.request(port,'POST','/api/timers',headers,json.dumps(data))[0],200)
        self.assertEqual(self.request(port,'POST','/api/timers',headers,json.dumps({**data,'request_id':'test-stale-123'}))[0],409)
        self.assertEqual(self.request(port,'GET','/api/timer-requests/invalid')[0],400)

    def test_untrusted_transport_cannot_reach_timer_engine(self):
        port=self.serve()
        self.enable()
        with patch.object(self.engine,'view',side_effect=AssertionError('read timer')):
            self.assertEqual(self.request(port,'GET','/api/timers')[0],403)

    def test_health_reports_dead_scheduler(self):
        self.enable()
        port=self.serve('172.30.32.2')
        status,body,_=self.request(port,'GET','/health')
        self.assertEqual(status,503)
        self.assertFalse(json.loads(body)['timers']['ok'])


class AlarmAssetTests(unittest.TestCase):
    def setUp(self):
        file=Path(__file__).resolve().parents[1]/'home-assistant-addon/rootfs/app/timer_alarm.py'
        spec=importlib.util.spec_from_file_location('alarm_asset_test',file)
        self.module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)

    def test_asset_installs_atomically_and_preserves_unexpected_file(self):
        import tempfile
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/'timer-alarm-v1.mp3'
            target.write_bytes(b'previous-file')
            self.module.install_sound(destination=folder)
            self.assertTrue(list(Path(folder).glob('*.before-*.mp3')))
            before=target.stat().st_mtime_ns
            self.module.install_sound(destination=folder)
            self.assertEqual(target.stat().st_mtime_ns,before)

    def test_mp3_duration_and_manifest_checksum(self):
        import hashlib
        folder=Path(__file__).resolve().parents[1]/'home-assistant-addon/rootfs/app/media'
        manifest=json.loads((folder/'timer-alarm-v1.json').read_text())
        data=(folder/manifest['file']).read_bytes()
        self.assertEqual(hashlib.sha256(data).hexdigest(),manifest['sha256'])
        # Validate every MPEG-1 Layer III CBR frame, including encoder padding.
        offset=frames=0
        while offset<len(data):
            header=int.from_bytes(data[offset:offset+4],'big')
            self.assertEqual(header>>21,0x7ff)
            self.assertEqual((header>>19)&3,3)  # MPEG-1
            self.assertEqual((header>>17)&3,1)  # Layer III
            self.assertEqual((header>>12)&15,9) # 128 kbps
            self.assertEqual((header>>10)&3,0)  # 44100 Hz
            offset+=int(144*128000/44100)+((header>>9)&1)
            frames+=1
        self.assertEqual(offset,len(data))
        self.assertLessEqual(frames*1152/44100,30)
        self.assertGreater(frames*1152/44100,28)

    def test_alarm_targets_never_include_sonos_or_spotify(self):
        file=Path(__file__).resolve().parents[1]/'home-assistant-addon/ha/timer-alarm.json'
        config=json.loads(file.read_text(encoding='utf-8'))
        encoded=json.dumps(config)
        self.assertNotIn('media_player.kitchen"',encoded)
        self.assertNotIn('spotifyplus',encoded)
        self.assertNotIn('scene.turn_on',encoded)
        self.assertIn('media_player.big_speaker',encoded)
        self.assertIn('media_player.kitchen_speaker',encoded)
