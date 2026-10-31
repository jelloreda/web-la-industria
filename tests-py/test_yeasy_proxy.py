import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))
import yeasy_proxy as p  # noqa: E402


class RutaPermitida(unittest.TestCase):
    def test_acepta_rutas_de_yeasy(self):
        for r in ["/availability", "/services/clientweb", "/employee/commerce/6f554a4a-15ea-4752-9ea5-985791a6c972"]:
            self.assertTrue(p.ruta_permitida(r), r)

    def test_rechaza_ssrf_y_rutas_raras(self):
        for r in ["https://evil.com/x", "//evil.com", "/../x", "/a?b=c", "x", "", None, "/a b"]:
            self.assertFalse(p.ruta_permitida(r), r)


class Autorizado(unittest.TestCase):
    def test_exige_secreto_exacto(self):
        with mock.patch.dict(os.environ, {"YEASY_PROXY_SECRET": "abc"}):
            self.assertTrue(p.autorizado("abc"))
            self.assertFalse(p.autorizado("abd"))
            self.assertFalse(p.autorizado(""))

    def test_sin_secreto_configurado_falla_cerrado(self):
        with mock.patch.dict(os.environ, {"YEASY_PROXY_SECRET": ""}):
            self.assertFalse(p.autorizado(""))


class LlamarYeasy(unittest.TestCase):
    def test_manda_origin_token_e_impersona_chrome(self):
        fake = mock.Mock(status_code=200, text='{"ok":1}')
        with mock.patch.dict(os.environ, {"YEASY_API_TOKEN": "tok"}), mock.patch.object(p.requests, "request", return_value=fake) as rq:
            out = p.llamar_yeasy({"method": "POST", "path": "/availability", "query": {"a": 1}, "body": {"x": 1}, "auth": True})
        self.assertEqual(out, {"status": 200, "body": '{"ok":1}'})
        args, kw = rq.call_args
        self.assertEqual(args, ("POST", "https://api.yeasy.io/availability"))
        self.assertEqual(kw["impersonate"], "chrome")
        self.assertEqual(kw["params"], {"a": "1"})
        self.assertEqual(kw["headers"]["Origin"], "https://app.yeasy.io")
        self.assertEqual(kw["headers"]["Authorization"], "Bearer tok")

    def test_sin_auth_no_manda_token(self):
        fake = mock.Mock(status_code=200, text="[]")
        with mock.patch.dict(os.environ, {"YEASY_API_TOKEN": "tok"}), mock.patch.object(p.requests, "request", return_value=fake) as rq:
            p.llamar_yeasy({"method": "GET", "path": "/services/clientweb"})
        self.assertNotIn("Authorization", rq.call_args.kwargs["headers"])


if __name__ == "__main__":
    unittest.main()
