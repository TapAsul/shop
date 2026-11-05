#!/usr/bin/env python3
"""Tiny static server that applies the Cloudflare `_headers` CSP, so we can
prove the site works under the same policy Cloudflare Pages will send."""
import http.server
import os
import re
import socketserver
import sys

ROOT = "/home/user/tapasul-site"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8081

# The real policy is whatever _headers says — read it from there so this
# test can never drift from what Cloudflare will actually send.
def _read_csp():
    try:
        txt = open(os.path.join(ROOT, "_headers"), encoding="utf-8").read()
    except OSError:
        txt = ""
    for line in txt.splitlines():
        if line.strip().lower().startswith("content-security-policy:"):
            return line.split(":", 1)[1].strip()
    return ("default-src 'self'; img-src 'self' data: blob:; font-src 'self'; "
            "style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; "
            "form-action 'self' https:; frame-ancestors 'self'; base-uri 'self'; object-src 'none'")


CSP = _read_csp()


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Content-Security-Policy", CSP)
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if not os.path.exists(os.path.join(ROOT, path.lstrip("/"))):
            if path.endswith("/"):
                self.send_error(404)
                return
            # serve 404.html with a real 404 status
            body = open(os.path.join(ROOT, "404.html"), "rb").read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), H) as httpd:
    print("CSP server on http://0.0.0.0:%d (root=%s)" % (PORT, ROOT))
    httpd.serve_forever()
