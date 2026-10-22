import json
import os
from unittest.mock import patch
import test_ingress_server


class SpotifyTests(test_ingress_server.IngressServerTests):
    def player(self, source="Kitchen", state="paused"):
        return {"state": state, "attributes": {"source": source, "source_list": ["Kitchen", "Big speaker"]}}

    def bridge(self, source="Kitchen", state="paused"):
        def request(path, data=None):
            if path == "states/" + self.app.ENTITY:
                return self.player(source, state)
            if path == "states/" + self.app.KITCHEN:
                return {"state": "paused"}
            return []
        return patch.object(self.app, "ha_request", side_effect=request)

    def test_kitchen_only_pause_resume_and_transfer(self):
        for source, state, action, service in (
            ("Kitchen", "playing", "pause", "player_media_pause"),
            ("Kitchen", "paused", "play", "player_media_resume"),
            ("Big speaker", "playing", "play", "player_transfer_playback"),
        ):
            with self.subTest(service=service), self.bridge(source, state) as request:
                self.assertEqual(self.app.command(action), ({"ok": True}, 200))
                path, data = request.call_args.args
                self.assertEqual(path, "services/spotifyplus/" + service)
                self.assertEqual(data["device_id"], "Kitchen")
                self.assertEqual(data["entity_id"], self.app.ENTITY)
                if service == "player_transfer_playback":
                    self.assertIs(data["force_activate_device"], False)

    def test_pause_never_controls_other_room_and_play_is_idempotent(self):
        for source, state, action in (("Big speaker", "playing", "pause"), ("Kitchen", "playing", "play")):
            with self.bridge(source, state) as request:
                self.app.command(action)
                self.assertFalse(any(c.args[0].startswith("services/") for c in request.call_args_list))

    def test_unavailable_and_failure_do_not_retry_or_leak(self):
        with self.bridge(state="unavailable") as request:
            self.assertEqual(self.app.command("play")[1], 503)
            self.assertFalse(any(c.args[0].startswith("services/") for c in request.call_args_list))
        with patch.object(self.app, "ha_request", side_effect=OSError("secret token")) as request:
            result, code = self.app.command("play")
            self.assertEqual(code, 502)
            self.assertNotIn("secret", json.dumps(result))
            self.assertEqual(request.call_count, 1)
            self.assertEqual(self.app.status(), {"state": "unavailable"})

    def test_route_guard_validation_and_status_allowlist(self):
        port = self.serve("172.30.32.2")
        with self.bridge("Big speaker", "playing") as request:
            status, body, _ = self.request(port, "GET", "/api/spotify")
            self.assertEqual((status, json.loads(body)), (200, {"state": "paused"}))
            self.assertEqual(self.request(port, "POST", "/api/spotify", body='{}')[0], 403)
            headers = {"Content-Type": "application/json", "X-Carnet-Request": "1"}
            self.assertEqual(self.request(port, "POST", "/api/spotify", headers, '{"action":"other"}')[0], 400)
            self.assertEqual(self.request(port, "POST", "/api/spotify", headers, '{"action":"pause","device_id":"Big speaker"}')[0], 200)
            self.assertFalse(any(c.args[0].startswith("services/") for c in request.call_args_list))

    def test_server_token_only_and_fixed_supervisor_url(self):
        with patch.dict(os.environ, {"SUPERVISOR_TOKEN": "test-secret"}), patch.object(self.app.urllib.request, "urlopen") as open_url:
            open_url.return_value.__enter__.return_value.read.return_value = b'{}'
            self.app.ha_request("states/" + self.app.ENTITY)
            request = open_url.call_args.args[0]
            self.assertEqual(request.full_url, "http://supervisor/core/api/states/" + self.app.ENTITY)
            self.assertEqual(request.get_header("Authorization"), "Bearer test-secret")
