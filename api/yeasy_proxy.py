"""Proxy interno hacia api.yeasy.io, con la huella TLS de Chrome (curl_cffi).

Yeasy filtra por huella TLS/JA3 (nov-2026): el fetch de Node recibe 403 aunque lleve las cabeceras
de un navegador. Las funciones Node (api/_lib/yeasy.ts) llaman aquí con POST + secreto compartido y
este endpoint hace la petición real. El token de Yeasy no sale de esta función.
"""
import hmac
import json
import os
import re
from http.server import BaseHTTPRequestHandler

from curl_cffi import requests

YEASY_API = "https://api.yeasy.io"
YEASY_ORIGIN = "https://app.yeasy.io"
IMPERSONATE = "chrome"
TIMEOUT_S = 10
METODOS = {"GET", "POST", "DELETE"}
RUTA_VALIDA = re.compile(r"^/[A-Za-z0-9/_.\-]*$")


def ruta_permitida(ruta) -> bool:
    return isinstance(ruta, str) and bool(RUTA_VALIDA.match(ruta)) and ".." not in ruta and "//" not in ruta


def autorizado(cabecera: str) -> bool:
    secreto = os.environ.get("YEASY_PROXY_SECRET", "")
    # Sin secreto configurado nunca se autoriza (falla cerrado).
    return bool(secreto) and hmac.compare_digest(cabecera.encode(), secreto.encode())


def llamar_yeasy(peticion: dict) -> dict:
    headers = {"Origin": YEASY_ORIGIN, "x-app-version": "2.1.0", "Content-Type": "application/json"}
    if peticion.get("auth"):
        token = os.environ.get("YEASY_API_TOKEN", "")
        if not token:
            return {"error": "falta YEASY_API_TOKEN"}
        headers["Authorization"] = f"Bearer {token}"
    cuerpo = peticion.get("body")
    r = requests.request(
        peticion["method"],
        YEASY_API + peticion["path"],
        params={str(k): str(v) for k, v in (peticion.get("query") or {}).items()},
        headers=headers,
        data=None if cuerpo is None else json.dumps(cuerpo),
        timeout=TIMEOUT_S,
        impersonate=IMPERSONATE,
    )
    return {"status": r.status_code, "body": r.text}


class handler(BaseHTTPRequestHandler):
    def _responder(self, codigo: int, datos: dict) -> None:
        cuerpo = json.dumps(datos).encode()
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def do_POST(self) -> None:
        if not autorizado(self.headers.get("x-proxy-secret", "")):
            return self._responder(401, {"error": "no autorizado"})
        try:
            peticion = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
        except ValueError:
            return self._responder(400, {"error": "JSON inválido"})
        if peticion.get("method") not in METODOS or not ruta_permitida(peticion.get("path")):
            return self._responder(400, {"error": "petición no permitida"})
        try:
            self._responder(200, llamar_yeasy(peticion))
        except Exception as e:  # noqa: BLE001 — sin detalles hacia fuera, solo el tipo
            print(f"[yeasy_proxy] {type(e).__name__} {peticion['method']} {peticion['path']}")
            self._responder(502, {"error": type(e).__name__})

    def do_GET(self) -> None:
        self._responder(405, {"error": "usa POST"})
