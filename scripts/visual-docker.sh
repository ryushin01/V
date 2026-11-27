#!/usr/bin/env bash
# 시각 회귀 기준 이미지를 CI와 같은 Linux에서 만들거나 비교합니다(Playwright 공식 Docker 이미지).
#
#   pnpm test:visual:update   기준 이미지 다시 만들기(e2e/**/*-snapshots)
#   pnpm test:visual          비교만
#
# Docker가 필요합니다(macOS는 colima start로 켜고, 끝나면 colima stop). 먼저 pnpm build와 pnpm build-storybook을 돌립니다.
# colima는 기본으로 홈 폴더만 컨테이너에 연결하므로 저장소가 홈 폴더 아래에 있어야 합니다(/tmp 등은 안 보임).
set -euo pipefail
cd "$(dirname "$0")/.."

# 잠금 파일에 적힌 Playwright 버전과 같은 이미지를 씁니다.
version=$(grep -m1 -oE "^  '?@playwright/test@[0-9.]+" pnpm-lock.yaml | sed -E "s/.*@//")
image="mcr.microsoft.com/playwright:v${version}-noble"
extra=()
if [[ "${1:-}" == "--update" ]]; then extra+=(--update-snapshots); fi

# node_modules는 macOS용이라, 컨테이너 안 /app에 저장소를 복사해 따로 설치합니다(저장소의 node_modules는 그대로).
# 끝나면 기준 이미지(e2e/**/*-snapshots)와 실패 결과(test-results)만 저장소로 되돌려 놓습니다.
pnpm_version=$(node -p "require('./package.json').packageManager.split('@')[1]")
# 설치 파일은 메모리(tmpfs)에 두어 Docker 디스크를 쓰지 않습니다.
docker run --rm --ipc=host -e CI=1 -v "$PWD:/work" \
  --tmpfs /app:size=4g,exec --tmpfs /root/.local/share/pnpm:size=2g,exec --tmpfs /root/.cache:size=1g \
  "$image" bash -c "
  set -e
  tar -C /work --exclude=./node_modules --exclude=./.git -cf - . | tar -C /app -xf -
  cd /app
  npm install -g --silent --allow-scripts=pnpm pnpm@${pnpm_version}
  pnpm install --frozen-lockfile --ignore-scripts >/dev/null
  status=0
  pnpm exec playwright test --project=visual --project=storybook ${extra[*]:-} || status=\$?
  find e2e -type d -name '*-snapshots' | tar -cf - -T - | tar -C /work -xf -
  rm -rf /work/test-results && cp -r test-results /work/ 2>/dev/null || true
  exit \$status
"
