import http.client
import importlib.util
import json
import os
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch


class IngressServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        for key, name in (("CARNET_DATA_DIR", "data"), ("CARNET_RECIPES_DIR", "recipes"), ("CARNET_WEB_DIR", "web")):
            env = patch.dict(os.environ, {key: str(root / name)})
            env.start()
            self.addCleanup(env.stop)
        source = Path(__file__).resolve().parents[1] / "home-assistant-addon/rootfs/app/server.py"
        spec = importlib.util.spec_from_file_location("carnet_ingress_test", source)
        self.app = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.app)
        self.app.ROOT.mkdir(parents=True, exist_ok=True)
        (self.app.ROOT / "index.html").write_text("private page", encoding="utf-8")

    def serve(self, peer=None):
        class TestHandler(self.app.Handler):
            def log_message(self, *args): pass
            def parse_request(self):
                # Test transport only; production has no override or bypass setting.
                if peer is not None:
                    self.client_address = (peer, self.client_address[1])
                return super().parse_request()
        server = ThreadingHTTPServer(("127.0.0.1", 0), TestHandler)
        worker = threading.Thread(target=server.serve_forever, daemon=True)
        worker.start()
        self.addCleanup(worker.join)
        self.addCleanup(server.server_close)
        self.addCleanup(server.shutdown)
        return server.server_port

    def request(self, port, method, path, headers=None, body=None):
        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        try:
            connection.request(method, path, body=body, headers=headers or {})
            response = connection.getresponse()
            return response.status, response.read(), response.getheaders()
        finally:
            connection.close()

    def test_only_exact_supervisor_peer_is_allowed(self):
        self.assertTrue(self.app.is_supervisor_peer("172.30.32.2"))
        for peer in ("127.0.0.1", "172.30.32.1", "172.30.33.2", "172.30.32.3", "192.168.1.2", "::1", "::ffff:172.30.32.2", "", None):
            with self.subTest(peer=peer):
                self.assertFalse(self.app.is_supervisor_peer(peer))

    def test_untrusted_requests_and_spoofed_headers_never_reach_data(self):
        port = self.serve()  # Real loopback socket peer must be rejected.
        headers = {"X-Forwarded-For": "172.30.32.2", "X-Ingress-Path": "/api/hassio_ingress/fake",
                   "X-Hass-Source": "core", "Host": "supervisor", "User-Agent": "HomeAssistantSupervisor",
                   "X-Carnet-Request": "1", "Content-Type": "application/json"}
        with patch.object(self.app, "load_recipes", side_effect=AssertionError("read")), \
             patch.object(self.app, "connect", side_effect=AssertionError("database")), \
             patch.object(self.app, "sync_from_github", side_effect=AssertionError("sync")), \
             patch.object(self.app, "validate_recipe_files", side_effect=AssertionError("image")), \
             patch.object(self.app.Handler, "send_head", side_effect=AssertionError("static file")):
            for method, path in (("GET", "/"), ("HEAD", "/index.html"), ("GET", "/health"),
                                 ("GET", "/api/recipes"), ("GET", "/api/states"),
                                 ("GET", "/recipe-assets/example/hero.webp"),
                                 ("POST", "/api/sync"), ("POST", "/api/ratings"),
                                 ("POST", "/api/favorites"), ("POST", "/api/notes"), ("PUT", "/")):
                with self.subTest(method=method, path=path):
                    status, body, _ = self.request(port, method, path, headers, '{}')
                    self.assertEqual(status, 403)
                    self.assertNotIn(b"private page", body)
                    if method == "HEAD": self.assertEqual(body, b"")

    def test_supervisor_health_static_head_api_and_sync(self):
        port = self.serve("172.30.32.2")
        # Watchdog has no Ingress headers or session cookie.
        status, body, _ = self.request(port, "GET", "/health")
        self.assertEqual((status, json.loads(body)), (200, {"status": "ok"}))
        self.assertEqual(self.request(port, "GET", "/")[1], b"private page")
        status, body, _ = self.request(port, "HEAD", "/index.html")
        self.assertEqual((status, body), (200, b""))
        with patch.object(self.app, "load_recipes", return_value=[{"id": "example"}]):
            self.assertEqual(json.loads(self.request(port, "GET", "/api/recipes")[1]), [{"id": "example"}])
        with patch.object(self.app, "sync_from_github", return_value={"state": "current"}) as sync:
            self.assertEqual(self.request(port, "POST", "/api/sync")[0], 403)
            sync.assert_not_called()
            status, body, _ = self.request(port, "POST", "/api/sync", {"X-Carnet-Request": "1"})
            self.assertEqual((status, json.loads(body)), (200, {"state": "current"}))
            sync.assert_called_once_with(force=True)


if __name__ == "__main__": unittest.main()
