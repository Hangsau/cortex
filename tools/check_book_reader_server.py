"""Exercise source allowlisting and restart recovery against real HTTP servers."""
import http.client
import json
import subprocess
import sys
import time

from book_sources import SITE


def request(path, port):
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    try:
        connection.request("GET", path)
        response = connection.getresponse()
        return response.status, response.read()
    finally:
        connection.close()


def main():
    port = 8769
    checks = 0
    for cycle in range(2):
        process = subprocess.Popen([sys.executable, "tools/book_reader.py", "serve", "--port", str(port)], cwd=SITE,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                   creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        try:
            ready = False
            for _ in range(50):
                if process.poll() is not None:
                    raise RuntimeError("Reader exited; ensure test port 8769 is free and build exists")
                try:
                    status, body = request("/cortex/reader-health", port)
                    ready = status == 200 and json.loads(body).get("originals") is True
                    if ready:
                        break
                except OSError:
                    pass
                time.sleep(0.1)
            assert ready, "Server failed to become ready"
            status, body = request("/cortex/originals/nordin/129/", port)
            assert status == 200 and "回中文讀本".encode() in body
            checks += 1
            for path in ["/cortex/%2e%2e/CLAUDE.md", "/cortex/originals/neumann/%2e%2e/CLAUDE.md",
                         "/cortex/originals/neumann/1/%5c..%5c", "/cortex/%00", "/cortex/originals/other/1/",
                         "/cortex/originals/neumann/0/", "/cortex/originals/neumann/9999/"]:
                assert request(path, port)[0] in (400, 404), path
                checks += 1
            status, body = request("/cortex/originals/neumann/1/?file=C:/claudehome/CLAUDE.md", port)
            assert status == 200 and "原檔第 1 頁".encode() in body
            checks += 1
        finally:
            process.terminate()
            process.wait(timeout=10)
    print(json.dumps({"restart_cycles": 2, "checks_passed": checks, "errors": []}))


if __name__ == "__main__":
    main()
