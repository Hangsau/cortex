#!/usr/bin/env bash
# 新版預覽站工作單佇列（Claude 撰寫）。依序把 W 派給 MiniMax-M3（claude-m3-lite），
# 由 check.py 判定是否通過；通過才由本腳本 commit + push（LLM 不碰 git）。
# 失敗：附上驗收輸出重試 2 次 → 仍失敗改派 codex 1 次 → 仍失敗就停在該單（後面的單依賴它）。
# 用法：bash next/specs/run_queue.sh [起始W，預設 W1]
set -uo pipefail

REPO="C:/claudehome/projects/my-site"
SPECS="$REPO/next/specs"
LOG="$SPECS/queue.log"
STATUS="$SPECS/STATUS.md"
QUEUE=(W1 W3 W4 W5 W6 W7 W8)
ALLOWED='^(next/|tools/build_vortex_links\.py|tools/test_vortex_links\.py|tools/build_library\.py|hugo\.next\.toml|\.github/workflows/deploy\.yml)'

cd "$REPO" || exit 2
# 用法：run_queue.sh W3（從 W3 跑到 W8）或 run_queue.sh --only L1 L3（只跑列出的單）
if [ "${1:-}" = "--only" ]; then shift; QUEUE=("$@"); start="${1:-}"; else start="${1:-W1}"; fi; started=0

log() { echo "[$(date '+%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }
status() { echo "- $(date '+%m-%d %H:%M') $*" >> "$STATUS"; }

push() {
  local token; token="$(gh auth token)"
  git remote set-url origin "https://$token@github.com/Hangsau/cortex.git"
  GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=credential.helper GIT_CONFIG_VALUE_0= git push -q origin hugo-source 2>&1 | tail -3
  git remote set-url origin "https://github.com/Hangsau/cortex.git"
}

prompt_for() {  # $1=W  $2=附加的失敗輸出（可空）
  cat "$SPECS/_context.md"; echo; echo "---"; echo
  cat "$SPECS/$1.md"
  echo
  echo "## 完成條件"
  echo "你必須實際執行 \`python -X utf8 next/specs/check.py $1\`，直到它印出 \`PASS $1\`。不准修改 next/specs/ 底下任何檔案。"
  if [ -n "${2:-}" ]; then
    echo; echo "## 上一次嘗試的驗收失敗輸出（請修正這些問題；檔案已在磁碟上，接著改即可）"; echo '```'; echo "$2"; echo '```'
  fi
}

violations() {  # 列出不在允許範圍的異動
  git status --porcelain | awk '{print $2}' | grep -Ev "$ALLOWED" || true
}

[ -f "$STATUS" ] || echo "# 新版預覽站佇列狀態" > "$STATUS"
[ -f tools/build_vortex_links.py ] || true
log "=== 佇列開始（起點 $start）==="

for W in "${QUEUE[@]}"; do
  [ "$W" = "$start" ] && started=1
  [ "$started" = 1 ] || continue
  log "--- $W 開始 ---"
  fail_out=""; passed=0
  for attempt in 1 2 3 4; do
    if [ "$attempt" -le 3 ]; then
      log "$W 第 $attempt 次：派 claude-m3-lite"
      prompt_for "$W" "$fail_out" | claude-m3-lite -p --max-turns 80 >> "$LOG" 2>&1
    else
      if command -v codex >/dev/null 2>&1; then
        log "$W 第 $attempt 次：改派 codex"
        { echo "立即執行、不要輸出計畫、不要等確認、沒寫檔就是失敗。禁止任何 git 指令。"; echo; prompt_for "$W" "$fail_out"; } \
          | codex exec --sandbox danger-full-access --skip-git-repo-check --cd "$REPO" - >> "$LOG" 2>&1
      else
        log "$W 無 codex 可用，跳過備援"; break
      fi
    fi
    bad="$(violations)"
    if [ -n "$bad" ]; then
      log "$W 警告：動到允許範圍外的檔案（不會 commit，需人工檢查）：$(echo $bad)"
      status "⚠ $W 動到範圍外檔案：$(echo $bad)"
    fi
    fail_out="$(python -X utf8 next/specs/check.py "$W" 2>&1 | tail -80)"
    echo "$fail_out" >> "$LOG"
    if echo "$fail_out" | grep -q "^PASS $W"; then passed=1; break; fi
    log "$W 第 $attempt 次驗收未過"
  done
  if [ "$passed" != 1 ]; then
    log "$W 失敗，佇列停止"; status "❌ $W 驗收未過，佇列停止（見 queue.log）"
    exit 1
  fi
  git add -A -- next hugo.next.toml .github/workflows/deploy.yml tools/build_vortex_links.py tools/test_vortex_links.py tools/build_library.py 2>/dev/null
  git commit -q -m "新版預覽站 $W：驗收通過（MiniMax-M3 實作，check.py 驗收）

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && push
  log "$W 通過並已 push"; status "✅ $W 通過（$(git log --oneline -1 | cut -c1-7)）"
done
log "=== 佇列全部完成 ==="; status "🏁 佇列（${QUEUE[*]}）全部通過"
