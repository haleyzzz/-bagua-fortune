#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
轻量命理服务：把已验证的 bazi-system 暴露成网页 API。
- 静态托管 index.html / app.html
- /api/bazi    POST  {birth 或 year/month/day/hour...} -> 八字全量 JSON
- /api/almanac GET  ?date=YYYY-MM-DD -> 单日黄历 JSON
- /api/month   GET  ?year=&month=    -> 整月每日黄历摘要 JSON

纯标准库，零额外依赖。精度与 bazi-system 单元测试一致。
"""
import sys, os, json, calendar as _cal
from urllib.parse import urlparse, parse_qs
import http.server
import socketserver

HERE = os.path.dirname(os.path.abspath(__file__))
BAZI = os.path.join(HERE, "bazi-system")
if BAZI not in sys.path:
    sys.path.insert(0, BAZI)

from bazi import analyze_bazi, query_almanac, to_json  # noqa: E402

PORT = int(os.environ.get("PORT", "8088"))


class Handler(http.server.BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _static(self, name, ctype):
        path = os.path.join(HERE, name)
        if not os.path.isfile(path):
            return self._send(404, json.dumps({"error": "not found"}))
        with open(path, "rb") as f:
            data = f.read()
        self._send(200, data, ctype)

    def do_GET(self):
        p = urlparse(self.path)
        route = p.path
        if route in ("/", "/index.html"):
            return self._static("index.html", "text/html; charset=utf-8")
        if route == "/app.html":
            return self._static("app.html", "text/html; charset=utf-8")
        if route == "/api/almanac":
            qs = parse_qs(p.query)
            d = qs.get("date", ["2026-07-24"])[0]
            try:
                return self._send(200, json.dumps(query_almanac(d), ensure_ascii=False))
            except Exception as e:
                return self._send(400, json.dumps({"error": str(e)}, ensure_ascii=False))
        if route == "/api/month":
            qs = parse_qs(p.query)
            y = int(qs.get("year", ["2026"])[0])
            m = int(qs.get("month", ["7"])[0])
            try:
                ndays = _cal.monthrange(y, m)[1]
                out = []
                for d in range(1, ndays + 1):
                    r = query_almanac("%04d-%02d-%02d" % (y, m, d))
                    out.append({
                        "day": d,
                        "lunar": r.get("lunar_display", ""),
                        "gz": r.get("ganzhi", {}).get("day", "") if isinstance(r.get("ganzhi"), dict) else str(r.get("ganzhi", "")),
                        "jianchu": r.get("jianchu", {}).get("name", "") if isinstance(r.get("jianchu"), dict) else "",
                        "yi": r.get("yiji", {}).get("宜", [])[:3],
                        "ji": r.get("yiji", {}).get("忌", [])[:3],
                        "term": r.get("term") or "",
                    })
                return self._send(200, json.dumps(out, ensure_ascii=False))
            except Exception as e:
                return self._send(400, json.dumps({"error": str(e)}, ensure_ascii=False))
        # 其它静态资产（css/js/图片/新页面等），按扩展名给正确 MIME
        if route != "/favicon.ico":
            _, ext = os.path.splitext(route)
            ctype = {
                ".html": "text/html; charset=utf-8",
                ".css": "text/css; charset=utf-8",
                ".js": "application/javascript; charset=utf-8",
                ".json": "application/json; charset=utf-8",
                ".svg": "image/svg+xml",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".ico": "image/x-icon",
                ".map": "application/json; charset=utf-8",
            }.get(ext.lower(), "application/octet-stream")
            return self._static(route.lstrip("/"), ctype)
        self._send(404, json.dumps({"error": "not found"}))

    def do_POST(self):
        p = urlparse(self.path)
        if p.path == "/api/bazi":
            try:
                length = int(self.headers.get("Content-Length", 0))
                raw = self.rfile.read(length) if length else b"{}"
                data = json.loads(raw.decode("utf-8") or "{}")
                # 兼容 "birth":"1990-05-20" 单参
                if "birth" in data and "year" not in data:
                    import datetime as _dt
                    bd = str(data.pop("birth"))
                    y, m, dd = map(int, bd.split("-"))
                    data.update(year=y, month=m, day=dd)
                result = analyze_bazi(data)
                return self._send(200, to_json(result))
            except Exception as e:
                return self._send(400, json.dumps({"error": str(e)}, ensure_ascii=False))
        self._send(404, json.dumps({"error": "not found"}))

    def log_message(self, *a):
        pass


def main():
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print("Serving 命理工具站 on http://localhost:%d  (Ctrl+C 停止)" % PORT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n已停止。")


if __name__ == "__main__":
    main()
