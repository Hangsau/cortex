"""Verify published chapter text, anchors, models, links and reader assets."""
import argparse
import hashlib
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[3]
BASE = "https://hangsau.github.io/cortex/"
PREVIEW = ROOT.parent.parent / "tmp/musculoskeletal-reader-preview"


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.in_article = False
        self.ids, self.headings, self.links, self.classes = set(), [], [], set()
        self.text, self.inputs = [], {}
        self.local_sources, self.embeds = [], []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get("class", "").split()
        self.classes.update(classes)
        if "rd-local-sources" in classes:
            self.local_sources.append("hidden" in attrs)
        if tag in {"img", "iframe", "object", "embed", "script"}:
            self.embeds.extend(attrs.get(k, "") for k in ["src", "srcset", "data"])
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "article" and "rd-prose" in classes:
            self.in_article = True
        if self.in_article:
            if tag == "h2" and "id" in attrs:
                self.headings.append(attrs["id"])
            if tag == "a" and "href" in attrs:
                self.links.append(attrs["href"])
            if tag == "input" and "id" in attrs:
                self.inputs[attrs["id"]] = attrs

    def handle_endtag(self, tag):
        if tag == "article":
            self.in_article = False

    def handle_data(self, data):
        if self.in_article:
            self.text.append(data)

    def prose(self):
        # Hugo minification changes whitespace between inline elements.
        return re.sub(r"\s+", "", "".join(self.text))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", required=True)
    parser.add_argument("--run-url", required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"[0-9a-f]{40}", args.commit):
        parser.error("--commit requires the full implementation SHA")
    checks, cache = [], {}

    def check(name, passed, detail=None):
        checks.append({"name": name, "pass": bool(passed), "detail": detail})

    def fetch(url):
        if url not in cache:
            req = Request(url, headers={"User-Agent": "Cortex-reader-verification", "Cache-Control": "no-cache"})
            with urlopen(req, timeout=30) as response:
                cache[url] = (response.status, response.read().decode("utf-8"))
            check("HTTP " + url, cache[url][0] == 200, cache[url][0])
        return cache[url][1]

    for slug, figure in [("kinesiology", "rd-lifting-load"), ("basic-biomechanics", "rd-lumbar-resultant")]:
        relative = "library/" + slug + "/ch10/"
        url = urljoin(BASE, relative)
        raw = fetch(url)
        live = Page(raw)
        local = Page((PREVIEW / relative / "index.html").read_text(encoding="utf-8"))
        canonical = (ROOT / "content" / relative / "index.md").read_text(encoding="utf-8")
        expected = re.findall(r"^## .+ \{#([a-z0-9-]+)\}", canonical, re.M)
        expected_sources = len(re.findall(r"\{\{<\s+reading-source\b", canonical))
        check(slug + " all canonical headings in order", live.headings == expected, len(live.headings))
        check(slug + " complete prose equals local accepted build", live.prose() == local.prose(),
              {"characters": len(live.prose()), "sha256": hashlib.sha256(live.prose().encode()).hexdigest()})
        check(slug + " new figure", figure in live.classes)
        check(slug + " original links hidden and no original-page embedding",
              len(live.local_sources) == expected_sources > 0 and all(live.local_sources) and
              "127.0.0.1" not in raw and "resources/books/" not in raw and
              not any("/originals/" in src for src in live.embeds),
              {"hidden_source_groups": len(live.local_sources)})
        if slug == "kinesiology":
            sliders = [a for a in live.inputs.values() if a.get("type") == "range"]
            check("lifting slider default and no-JS state", len(sliders) == 1 and
                  all(sliders[0].get(k) == v for k, v in {"min": "10", "max": "50", "value": "29"}.items()) and "disabled" in sliders[0])
            check("lifting default forces", all(n in live.prose() for n in ["2512", "3232"]))
        else:
            check("lumbar resultant values", all(n in live.prose() for n in ["4382", "373", "4398"]))
        other = "basic-biomechanics" if slug == "kinesiology" else "kinesiology"
        cross = sorted({urljoin(url, h) for h in live.links if "/library/" + other + "/" in h and "#" in h})
        expected_cross = {urlsplit(urljoin(url, h)).path + "#" + urlsplit(h).fragment for h in local.links if "/library/" + other + "/" in h and "#" in h}
        check(slug + " precise cross-book links equal local", {urlsplit(h).path + "#" + urlsplit(h).fragment for h in cross} == expected_cross, len(cross))
        for target in cross:
            parts = urlsplit(target)
            target_page = Page(fetch(parts._replace(fragment="").geturl()))
            check("cross-book anchor " + target, parts.fragment in target_page.ids)

    for asset in ["css/reading.css", "js/reading.js"]:
        public = fetch(urljoin(BASE, asset)).replace("\r\n", "\n")
        local = (ROOT / "static" / asset).read_text(encoding="utf-8").replace("\r\n", "\n")
        check(asset + " equals accepted local asset", public == local,
              hashlib.sha256(public.encode()).hexdigest())
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "implementation_commit": args.commit,
              "deployment_run_url": args.run_url, "ci_verification": "Full SHA and conclusion checked separately with gh run",
              "base": BASE, "checks": checks, "passed": sum(c["pass"] for c in checks),
              "failed": sum(not c["pass"] for c in checks)}
    Path(__file__).with_name("public-validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ["checked_at", "passed", "failed"]}))
    for item in checks:
        if not item["pass"]:
            print(json.dumps(item, ensure_ascii=False))
    raise SystemExit(1 if report["failed"] else 0)


if __name__ == "__main__":
    main()
