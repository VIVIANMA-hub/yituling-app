#!/usr/bin/env bash
# 安装一图灵 git 钩子到本地 .git/hooks/
# 用法：在项目根运行  bash scripts/hooks/install.sh
# 改用 symlink：以后改 scripts/hooks/pre-commit 立即生效，不必重装。
# git 钩子不随仓库分发，重新 clone 后需重跑本脚本。

set -euo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -z "$root" ]; then
  echo "✗ 当前不在 git 仓库内，请先 cd 到项目根。" >&2
  exit 1
fi

cd "$root"
mkdir -p .git/hooks
for src in scripts/hooks/pre-commit scripts/hooks/commit-msg scripts/hooks/pre-push; do
  [ -f "$src" ] || continue
  name=$(basename "$src")
  dest=".git/hooks/$name"
  ln -sf "../../$src" "$dest"
  chmod +x "$src"
  echo "✓ installed $dest -> $src"
done

echo ""
echo "完成。下次 git commit 时会自动跑 pre-commit 拦截密钥/患者隐私/商业机密。"
