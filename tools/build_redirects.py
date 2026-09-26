"""舊站網址 → 新站網址轉址頁產生器（新版切換用，Claude 撰寫）。

做法：
1. 讀舊站網址清單（`next/data/legacy_urls.txt`，由 `--snapshot` 從舊站建置結果產生並 commit，
   切換後舊版型刪除就無法再建置舊站，所以清單必須先存下來）。
2. 建置新站到暫存目錄，列出新站實際存在的頁面。
3. 舊網址在新站不存在者，依 RULES（前綴對應）找新網址；新網址必須真的存在，否則報錯。
4. 為每一筆寫出 `next/static/<舊路徑>/index.html`（meta refresh ＋ canonical ＋ 可點連結）。

用法：
  python -X utf8 tools/build_redirects.py --snapshot   # 從舊站建置結果存下網址清單（只在切換前做一次）
  python -X utf8 tools/build_redirects.py              # 產生轉址頁；有對不到的舊網址就 exit 1
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY = ROOT / "next" / "legacy_urls.txt"
STATIC = ROOT / "next" / "static"
BASE = "/cortex/"

# 舊路徑前綴 → 新路徑前綴（由長到短比對；值為 None 表示整頁併入某個新頁）
RULES = [
    ("vortex/freestyle/", "vortex/free/"),
    ("vortex/backstroke/", "vortex/back/"),
    ("vortex/breaststroke/", "vortex/breast/"),
    ("vortex/butterfly/", "vortex/fly/"),
    ("vortex/underwater-dolphin-kick/", "vortex/udk/"),
    ("vortex/technica/water-sense-guide/", "vortex/water-sense/"),
    ("vortex/psychology-read/", "vortex/psychology/"),
    ("vortex/database/", "vortex/"),
    ("vortex/knowledge-hub/", "vortex/"),
    ("library/mind-for-numbers/toolkit/", "library/mind-for-numbers/"),
    ("library/uncommon-sense-teaching/handbook/", "library/uncommon-sense-teaching/"),
]


def build(dest, config=None):
    cmd = ["hugo", "--minify", "--quiet", "-d", str(dest)]
    if config:
        cmd[1:1] = ["--config", config]
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        sys.exit(f"建置失敗：{proc.stderr[-2000:]}")


def pages(dest):
    return {p.parent.relative_to(dest).as_posix().rstrip(".") for p in dest.rglob("index.html")}


def norm(p):
    p = p.strip("/")
    return f"{p}/" if p else ""


def snapshot():
    """只在切換前有效：舊版型已於 2026-09-26 移除（封存於 git 標籤 legacy-site-2026-09-26），
    現在執行會建出新站而不是舊站，因此直接拒絕，保護 next/legacy_urls.txt 不被覆寫。"""
    sys.exit("舊站已移除，不能再產生舊網址清單；next/legacy_urls.txt 是切換前的最終版本，勿覆寫")
    tmp = Path(tempfile.mkdtemp())
    try:
        build(tmp)
        urls = sorted(norm(p) for p in pages(tmp) if not p.startswith("next"))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    LEGACY.parent.mkdir(parents=True, exist_ok=True)
    LEGACY.write_text("\n".join(urls) + "\n", encoding="utf-8")
    print(f"舊站網址 {len(urls)} 筆 → {LEGACY.relative_to(ROOT)}")


def target_for(old, existing):
    for src, dst in sorted(RULES, key=lambda r: -len(r[0])):
        if old.startswith(src):
            cand = dst + old[len(src):]
            if cand in existing:
                return cand
            if dst in existing:
                return dst
    return None


def redirect_html(new):
    url = BASE + new
    return (
        "<!doctype html><html lang=\"zh-Hant\"><head><meta charset=\"utf-8\">"
        f"<title>此頁已搬移</title><link rel=\"canonical\" href=\"{url}\">"
        f"<meta name=\"robots\" content=\"noindex\"><meta http-equiv=\"refresh\" content=\"0; url={url}\">"
        f"</head><body><p>此頁已搬到 <a href=\"{url}\">{url}</a>。</p></body></html>\n"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot", action="store_true")
    args = ap.parse_args()
    if args.snapshot:
        snapshot()
        return
    if not LEGACY.exists():
        sys.exit("缺舊站網址清單，先跑 --snapshot")
    legacy = [l.strip() for l in LEGACY.read_text(encoding="utf-8").splitlines() if l.strip() or l == ""]
    legacy = [norm(l) for l in LEGACY.read_text(encoding="utf-8").splitlines()]
    if STATIC.exists():
        for d in [p for p in STATIC.rglob("index.html") if "此頁已搬移" in p.read_text(encoding="utf-8")]:
            d.unlink()
    tmp = Path(tempfile.mkdtemp())
    try:
        build(tmp)
        existing = {norm(p) for p in pages(tmp)}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    made, missing = 0, []
    for old in legacy:
        if old in existing:
            continue
        new = target_for(old, existing)
        if not new:
            missing.append(old)
            continue
        out = STATIC / old / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(redirect_html(new), encoding="utf-8")
        made += 1
    print(f"舊網址 {len(legacy)}：新站已有 {len(legacy) - made - len(missing)}、轉址 {made}、對不到 {len(missing)}")
    for m in missing:
        print("  對不到：/" + m)
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
