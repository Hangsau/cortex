#!/usr/bin/env python3
"""PreToolUse hook：擋掉發包代理跑的任何 git 指令。

`cscs_quiz_delegate_prompt.md` 第 8 行寫著「禁止任何 git 指令」，2026-09-14 的 ch04
發包證明**這條散文擋不住**——MiniMax 讀完照樣 commit 並 push 了。這正是本專案那條
founding principle 的又一次驗證：沒有閘的規則發包出去不會生效。所以把它做成閘。

用法見 `cscs_quiz_delegate_settings.json`；退出碼 2 會擋下工具呼叫並把 stderr 回餵給模型。
"""
import json
import re
import sys

GIT = re.compile(r"(?:^|[|&;(`]|\$\()\s*(?:sudo\s+)?git(?:\.exe)?\b", re.IGNORECASE)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    if payload.get("tool_name") != "Bash":
        return 0
    command = (payload.get("tool_input") or {}).get("command") or ""
    if not GIT.search(command):
        return 0
    sys.stderr.write(
        "這個任務禁止任何 git 指令。你只要把題目寫進 yaml 並跑到閘全綠就算完成，"
        "commit 與 push 由派工方負責——他要先逐題對源檔查證過才會落盤。\n"
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
