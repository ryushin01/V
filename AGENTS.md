# AGENTS.md — V (데스크·게이밍 셋업 배치도)

AI 코딩 에이전트(Codex, Claude Code 등)가 이 저장소에서 일할 때 지킬 규칙입니다. 자세한 내용은 `docs/development.md`, `docs/accessibility.md`, `docs/catalog.md`, `README.md`에 있습니다.

## 1. 프로젝트 개요

- 책상·모니터·PC·게임기·의자·TV·오디오·콘센트를 실제 cm 크기로 방에 배치하고 겹침·동선·시청 거리·전력을 점검하는 웹 앱입니다. 서버 없이 브라우저 IndexedDB에만 저장하는 포트폴리오 프로젝트입니다.
- 화면 축 1개: 배치도 웹 앱(첫 화면·편집·공유 보기). 로그인 없음.
- 운영: https://v-setup-planner-ryushin01.vercel.app/ (첫 화면의 **예시로 시작하기**).

## 2. 기술 스택과 구조

- Svelte 5(runes mode), SvelteKit 3 + adapter-static, TypeScript, SVG 2D, Scoped CSS, 서비스 워커(PWA), Storybook 10.
- **FSD v2.1.** 층 순서(위→아래): `app` → `pages` → `features` → `entities` → `shared`. 층은 `src/` 바로 아래에 두고(SvelteKit 3에서 `kit.files`·`kit.alias` deprecated), `src/routes`는 페이지를 렌더링만 합니다.
- import 경로는 `package.json`의 `imports`(`#entities/plan` 등)로, 공개 API(`index.ts`)만 연결되므로 건너뛸 수 없습니다. 한 페이지에서만 쓰는 코드는 그 페이지 슬라이스에(편집 세션은 `pages/editor`). `pnpm lint:fsd`(Steiger)로 검사합니다.
- 컴포넌트 옆에 `*.stories.ts`와 테스트를 둡니다. 상태는 class 기반 `$state`·`$derived`, 되돌리기는 `$state.snapshot`·`$state.raw`(`docs/development.md`의 'runes 사용 방식').
- 서비스 워커(`src/service-worker/`)는 따로 둔 `tsconfig.json`으로 검사하고 루트 tsconfig·Steiger에서 뺍니다.

## 3. 설치·개발 명령

- Node.js 26(`.nvmrc`), pnpm 12(`packageManager`).

```bash
corepack enable pnpm
pnpm install
pnpm dev   # http://localhost:5173
```

- 환경 변수(이름만, `.env.example`): `VITE_SENTRY_DSN`(있을 때만 Sentry). `pnpm screenshots`는 `BASE_URL`을 씁니다.
- 자료 명령: `pnpm fonts`(화면 글자를 바꾼 뒤 한글 글꼴, 원본을 바꾸면 `--all`), `pnpm icons`(설치 아이콘), `pnpm screenshots`(`build`·`preview` 뒤 README 화면과 `static/og-image.jpg`).

## 4. 검사·테스트 명령

| 명령                                | 내용                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `pnpm format:check` / `pnpm format` | Prettier 검사 / 정리(Markdown 포함)                                     |
| `pnpm lint`                         | ESLint(eslint-plugin-svelte)                                            |
| `pnpm lint:fsd`                     | Steiger(FSD)                                                            |
| `pnpm check`                        | svelte-check + 서비스 워커 타입 검사                                    |
| `pnpm test`                         | 단위·컴포넌트(Vitest, Testing Library)                                  |
| `pnpm build`                        | 정적 빌드(`build/`, `spa.html`을 `404.html`로 복사)                     |
| `pnpm build-storybook`              | Storybook 빌드                                                          |
| `pnpm test:e2e`                     | 프로덕션 빌드 E2E(룰러·키보드·저장·화면 폭·axe·CSP·오프라인), 먼저 빌드 |
| `pnpm size`                         | 전체 JS 125 kB, CSS 42 kB(gzip) 예산(`.size-limit.json`)                |
| `pnpm lhci`                         | 성능 90·접근성 100·권장 95·SEO 90 등(`lighthouserc.json`)               |

- CI(`.github/workflows/ci.yml`, PR·main 푸시) 순서: `format:check` → `lint` → `lint:fsd` → `check` → `test` → `build` → `build-storybook` → Chromium 설치 → `test:e2e` → `size` → `lhci`.
- 커밋 훅(husky 등)은 없으므로 PR 전에 위 검사를 직접 돌립니다.

## 5. 코드 스타일

- Prettier: 탭 들여쓰기, 작은따옴표, 끝 쉼표 없음, 한 줄 100자, `prettier-plugin-svelte`. Markdown도 Prettier 검사 대상입니다(표 정렬 포함).
- `localStorage`·IndexedDB 읽기·쓰기는 실패해도 화면이 멈추지 않게 감쌉니다. 파일·공유 링크에서 온 값은 `entities/plan/model/guards.ts`로 검사합니다.
- 화면 글자를 바꾸면 `pnpm fonts`를 다시 돌립니다(빠지면 `fonts.test.ts` 실패, `.svelte`는 주석 글자도 셈). 한글 굵기는 500까지만 씁니다.
- 외부 스크립트·이미지를 새로 쓰면 CSP 지시어(`vite.config.ts`의 `csp`)를 함께 고칩니다. `src/app.html`의 인라인 스크립트는 한 블록으로 둡니다.
- 버그를 고치면 고치기 전에 실패하는 테스트를 함께 넣습니다.
- 접근성(KWCAG 2.2, `docs/accessibility.md`): 네이티브 요소 우선, 텍스트 대비 4.5:1 이상, 배치·룰러 조작을 포함한 모든 기능 키보드, 초점 표시 유지(`outline: none` 단독 금지), 조작 크기 24px 이상, 입력 레이블과 오류의 `aria-invalid`·`aria-describedby` 연결, 바뀌는 안내는 `shared/ui`의 `LiveMessage`(`role="status"`), 화면마다 고유 제목(`PageMeta`). Svelte 접근성 경고는 `svelte/valid-compile`·`svelte-check`가 잡습니다.

## 6. Git·PR

- `main`에 직접 커밋·푸시하지 않습니다(예외: `gear-sync.yml` 봇이 매일 `chore: 쇼핑몰 제품 동기화`를 main에 올림). 최신 `main`에서 `feat/v1.x.y-…`, `fix/v1.x.y-…`, `docs/…` 브랜치를 만들고 PR을 올립니다.
- 커밋: `<type>: 한국어 요약` 예) `feat: 디자인을 My First Gear 쇼핑몰의 HUD 개편에 맞춤, 1.3.0`. PR 제목은 버전을 앞에 둡니다 예) `1.3.0: 디자인을 My First Gear 쇼핑몰의 HUD 개편에 맞춤`. 커밋 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, PR 본문 끝에 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- 버전: 기능·수정 PR은 `CHANGELOG.md`에 `## x.y.z - YYYY-MM-DD` 절을 더하고 README 버전 배지를 맞춥니다. 문서만 바뀐 PR은 보통 버전을 올리지 않습니다.
- 병합은 **merge commit**(`Merge pull request #번호 …`). **CI가 통과하면 바로 병합**하고 CodeRabbit 리뷰는 기다리지 않습니다(이미 달린 맞는 지적은 반영). Dependabot 주 버전 PR은 변경 내역을 보고 CI 통과 때만 병합합니다.
- 공개 저장소라 Actions가 돕니다. Actions가 막히면 CI와 같은 검사를 로컬에서 돌려 대신합니다.

## 7. 배포·릴리스

- Vercel 프로젝트 `v-setup-planner`(정적 결과물 `build/`). **main만 배포**하고 PR 미리보기는 끔(`vercel.json`의 `git.deploymentEnabled`). Ignored Build Step이 없어 문서만 바꿔도 병합하면 배포됩니다. Vercel Hobby는 계정 전체 하루 100회 한도라 푸시를 모읍니다.
- 라우팅·응답 헤더는 `vercel.json`의 `routes`로 둡니다(`headers`와 함께 쓸 수 없음, 끝에 404를 명시).
- 데모 모드: 별도 플래그 없이 늘 브라우저 저장소만 씁니다. 금액은 가상 데이터입니다.
- `gear-sync.yml`: 매일 03:50(KST) My-First-Gear 쇼핑몰 피드(`/feed/gear.json`)를 받아 없는 제품을 카탈로그에 들이고, 바뀌면 `pnpm fonts`·`check`·`test` 뒤 main에 올립니다(→ 운영 배포).
- 배포 뒤 운영 주소·공유·편집 화면이 200인지 확인합니다.
- 릴리스: 병합 뒤 태그 `vX.Y.Z`, 제목 `vX.Y.Z`, 대상은 병합 커밋 전체 SHA, 본문은 CHANGELOG의 해당 절. 그 뒤 백업 `bash ~/Documents/Archive/Backup/backup.sh`.
- 보관함 계획 문서: `~/Documents/Obsidian Vault/V v1.0.0 고도화 계획.md`. 진행 기록을 날짜와 함께 남깁니다.
- 소개가 크게 바뀌면 프로필 저장소 `ryushin01/ryushin01` README 프로젝트 표(내용·기술·실행 칸)를 고칩니다. 버전 숫자는 Actions가 자동으로 고칩니다.

## 8. 보안·주의사항

- 비밀값·`.env`(`.env.local` 포함)를 커밋하지 않습니다. 유료 API 키를 쓰지 않습니다.
- 보안 헤더(`vercel.json`)와 해시 방식 CSP를 유지합니다. E2E가 `securitypolicyviolation`이 없는지 확인합니다.
- Sentry에는 오류 내용만 보내고 사용자 정보·쿠키·쿼리·브레드크럼은 모으지 않습니다.
- 운영 주소가 바뀌면 `shared/config`의 `SITE.url`, `static/robots.txt`, `static/sitemap.xml`을 함께 고칩니다.
- 쇼핑몰에서 판매를 마친 제품도 카탈로그에 남깁니다(이미 놓은 배치도가 열리도록). `src/entities/plan/model/sync/shop-feed.ts`는 동기화 스크립트가 만드는 파일입니다.
- 제품 치수·전력은 공개 자료를 우선 쓰고, 확인하지 못한 값은 추정값으로 표시하며 출처를 `docs/catalog.md`에 적습니다. 아이콘·글꼴을 새로 넣으면 README 출처 표에 저작자·라이선스·원본을 적습니다(블랙레터 V 아이콘은 Flaticon 저작자 표기 조건).

## 9. 공통 규칙

공통 규칙은 `~/Documents/GitHub/CLAUDE.md`에 있습니다(이 파일과 충돌하면 이 파일이 우선). 핵심:

- 답변·커밋·PR·문서·코드 주석은 한국어로 씁니다.
- 묻지 않고 끝까지 진행하고 결과를 한 번에 보고합니다. 비용이 드는 일, 새 비밀값, 디자인 결정, 되돌릴 수 없는 공개 행동은 하지 않고 보고합니다.
- 사용자의 진행 중인 작업(커밋하지 않은 변경, 원격에 없는 브랜치)을 건드리지 말고 `git worktree add /tmp/<이름> -b <브랜치> origin/main`에서 작업한 뒤 worktree를 지웁니다.
- 다른 세션에 공지할 때는 Paseo ryushin01 그룹 세션에만 보냅니다.
