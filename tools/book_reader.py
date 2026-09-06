"""Build and serve the Chinese readers with read-only local original pages."""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from book_sources import BOOKS, BOOK_ROOT, SITE, WORKSPACE, book_pages

PREVIEW = WORKSPACE / "tmp" / "musculoskeletal-reader-preview"
PREFIX = "/cortex/"


class ReaderHandler(SimpleHTTPRequestHandler):
    page_cache = {}

    def log_message(self, format, *args):
        if len(args) < 2 or str(args[1]) != "200":
            super().log_message(format, *args)

    def reply(self, content: bytes, mime: str, head: bool) -> None:
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if not head:
            self.wfile.write(content)

    def dispatch(self, head: bool = False) -> None:
        try:
            path = unquote(urlsplit(self.path).path, errors="strict")
        except (ValueError, UnicodeError):
            self.send_error(400)
            return
        if len(path) > 2048 or "\\" in path or "\0" in path or ".." in path.split("/"):
            self.send_error(400)
            return
        if path == PREFIX + "reader-health":
            self.reply(b'{"originals":true}', "application/json; charset=utf-8", head)
            return
        if path.startswith(PREFIX + "originals/"):
            match = re.fullmatch(re.escape(PREFIX) + r"originals/(neumann|nordin)/([1-9][0-9]{0,3})/(image\.png)?", path)
            if not match:
                self.send_error(404)
                return
            key, page_text, image = match.groups()
            page = int(page_text)
            book = BOOKS[key]
            pages = self.page_cache[key]
            if page not in pages:
                self.send_error(404)
                return
            if image:
                image_path = BOOK_ROOT / book["folder"] / "pages" / f"p{page:04}.png"
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(image_path.stat().st_size))
                self.send_header("Cache-Control", "private, max-age=3600")
                self.send_header("X-Content-Type-Options", "nosniff")
                self.end_headers()
                if not head:
                    with image_path.open("rb") as stream:
                        shutil.copyfileobj(stream, self.wfile)
                return
            chapter = next((row for row in book["chapters"] if row[2] <= page <= row[3]), None)
            back = PREFIX + "library/" + book["slug"] + "/" + (f"ch{chapter[0]:02}/" if chapter else "")
            navigation = f'<a href="{back}">← 回中文讀本</a>'
            if page > 1:
                navigation += f'<a href="../{page-1}/">上一頁</a>'
            if page < max(pages):
                navigation += f'<a href="../{page+1}/">下一頁</a>'
            title = html.escape(book["title"])
            text = html.escape(pages[page]["text"])
            document = f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} · 原檔第 {page} 頁</title>
<style>body{{margin:0;background:#faf8f2;color:#202c30;font:18px/1.8 system-ui,sans-serif}}main{{max-width:1200px;margin:auto;padding:24px}}nav{{display:flex;gap:24px;flex-wrap:wrap}}a{{color:#225c61;text-underline-offset:4px;padding:8px 0}}h1{{font-size:24px;line-height:1.5}}img{{display:block;width:100%;height:auto}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font:16px/1.8 Georgia,serif}}summary{{cursor:pointer;padding:16px 0}}:focus-visible{{outline:3px solid #225c61;outline-offset:4px}}</style>
<main><nav>{navigation}</nav><h1>{title} · 原檔第 {page} 頁</h1><p>此頁次按 PDF 檔案計算；印刷頁碼請見原頁。雙欄、圖說與表格以圖片中的原始順序閱讀。</p><img src="image.png" alt="{title}原檔第 {page} 頁完整掃描"><details><summary>查看這一頁的英文文字（轉檔可能有交錯，請以原頁為準）</summary><pre lang="en">{text}</pre></details><nav>{navigation}</nav></main></html>'''
            self.reply(document.encode("utf-8"), "text/html; charset=utf-8", head)
            return
        if path in ("/", "/cortex"):
            self.send_response(302)
            self.send_header("Location", PREFIX + "library/kinesiology/")
            self.end_headers()
            return
        if not path.startswith(PREFIX):
            self.send_error(404)
            return
        # Strip only the known deployment prefix. SimpleHTTPRequestHandler keeps
        # the remaining static path rooted inside its configured directory.
        self.path = "/" + path[len(PREFIX):]
        if head:
            super().do_HEAD()
        else:
            super().do_GET()

    def do_GET(self):
        self.dispatch()

    def do_HEAD(self):
        self.dispatch(head=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["build", "serve"])
    parser.add_argument("--port", type=int, default=8768)
    parser.add_argument("--build", action="store_true")
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("port must be between 1024 and 65535")
    if args.command == "build" or args.build:
        executable = shutil.which("hugo")
        if not executable:
            raise SystemExit("Hugo is required to build the reader.")
        result = subprocess.run([executable, "--destination", str(PREVIEW), "--baseURL", f"http://127.0.0.1:{args.port}{PREFIX}"], cwd=SITE)
        if result.returncode:
            raise SystemExit(result.returncode)
    if args.command == "build":
        return
    if not (PREVIEW / "library/kinesiology/index.html").is_file():
        raise SystemExit("Build the reader first: python tools/book_reader.py build")
    ReaderHandler.page_cache = {key: book_pages(key) for key in BOOKS}
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(ReaderHandler, directory=str(PREVIEW)))
    print(f"Reader: http://127.0.0.1:{args.port}{PREFIX}library/kinesiology/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
