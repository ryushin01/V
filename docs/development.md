# 개발 가이드

## 구조

Feature-Sliced Design v2.1을 따르며 `pnpm lint:fsd`(Steiger)로 검사합니다.

- SvelteKit 3에서 `kit.files`와 `kit.alias`가 deprecated되어, 계층은 `src/` 바로 아래에 두고 `src/routes`의 파일은 페이지를 렌더링만 합니다.
- 경로는 `package.json`의 `imports`로 지정합니다. `#entities/plan`은 `src/entities/plan/index.ts`로만 연결되므로 공개 API를 건너뛸 수 없습니다.
- 한 페이지에서만 쓰는 코드는 페이지 슬라이스에 둡니다. 편집 세션이 `pages/editor`에 있는 이유입니다.
- 컴포넌트 옆에 `*.stories.ts`와 테스트를 둡니다. 편집기 패널의 테스트는 `editor-panels.test.ts`에 모았습니다.
- 여러 곳에서 쓰는 것은 공통으로 둡니다: 파일 내려받기·읽기(`shared/lib/file`, 읽기는 크기 한도와 실패를 처리), 상태 메시지 영역(`shared/ui`의 `LiveMessage`), 화면 제목·공유 미리보기(`PageMeta`), 파일 검사 함수(`entities/plan/model/guards.ts`), 도면을 그리는 층 순서(`LAYER_ORDER`).

## runes 사용 방식

| 위치                     | 사용                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `PlacedItem`             | 좌표·회전은 필드별 `$state`, 사각형과 범위는 `$derived`                                                       |
| `EditorSession.analysis` | 방과 물건에서 파생되는 점검 결과 `$derived`                                                                   |
| 되돌리기                 | `$state.snapshot`으로 기록하고, 기록 배열은 `$state.raw`로 통째로 교체                                        |
| `NumberField`            | 외부 값에서 파생되지만 입력 중에는 덮어쓰는 `$derived`                                                        |
| `EditorPage`             | 자동 저장은 `$effect`가 내용이 바뀔 때만 타이머를 다시 걸어 지연. 비교 문자열에서 평면도 이미지는 번호로 바꿈 |

## 좌표

- 단위는 cm이고 방의 왼쪽 위가 원점입니다. 물건의 `x`, `y`는 중심이며 회전은 시계 방향입니다.
- 회전 0도에서 의자는 위쪽을, 화면은 아래쪽을 바라봅니다.
- 화면 좌표는 `cm × scale + offset`입니다.

## 룰러

- 편집 화면: `computeRulerTicks`가 큰 눈금 약 64px, 잔눈금 약 8px에 가까운 간격을 고릅니다. 숫자는 1·2·5 계열의 깔끔한 cm 값이어야 하므로 실제 간격은 배율에 따라 달라집니다.
- 첫 화면: 잔눈금 8px, 중간 눈금 32px, 큰 눈금과 숫자 64px로 고정합니다(`fixedStep`, `bare`). 숫자는 가독성을 위해 11px입니다.
- 오른쪽 `PageScale`은 스크롤바를 대신하며, 휠·터치·키보드 스크롤은 그대로 동작합니다.

## X-ray

`features/toggle-xray`의 상태는 페이지를 옮겨도 유지됩니다. 켜면 `html[data-xray]`로 색 변수를 바꾸고 `XrayOverlay`가 도면 위에 치수를 그립니다. 같은 정보가 물건 이름과 점검 패널에 있어 오버레이는 보조기술에 숨깁니다.

## 점검 기준

| 항목        | 기준                                                            |
| ----------- | --------------------------------------------------------------- |
| TV 거리     | 16:9 화면의 수평 시야각 40°~30°가 되는 거리, 좌석 중심까지 직선 |
| 모니터 거리 | 50~100cm, 좌석 중심까지 직선                                    |
| 의자 여유   | 등받이 뒤 60cm                                                  |
| 통로        | 폭 60cm, 10cm 격자로 문에서 좌석 주변까지 너비 우선 탐색        |
| 케이블      | 기기 중심과 전원의 직선 거리. 실제 배선은 더 길 수 있습니다     |
| 전원 연결   | 가까운 순서로 빈 구에 자동 배정                                 |

정격과 치수는 `entities/plan/model/catalog.ts`의 기본값이며 특정 제품의 사양이 아닙니다.

점검은 물건을 끄는 동안 포인터가 움직일 때마다 다시 계산하므로 빠르게 유지합니다.

- 통로 탐색은 칸마다 모든 물건을 보지 않고, 물건마다 자기 둘레(경계 상자 + 통로 반폭)의 칸만 확인해 막습니다.
- 겹침·문·의자 여유는 경계 상자가 1cm 넘게 떨어진 쌍을 분리축 검사 없이 건너뜁니다. 사각형끼리는 분리축 방향의 간격이 실제 거리의 cos 45° 이상이라 결과가 같습니다.
- 0.8.0 구현(`analysis.legacy.ts`, 시험 전용)과 무작위 배치 수백 개의 결과가 같은지 `analysis.equivalence.test.ts`가 확인합니다. 1500×1500cm·물건 200개 기준 계산 한 번이 약 280ms에서 3ms가 되었습니다.
- 점검 항목의 `id`는 점검 종류와 물건으로 정합니다(같은 조합이 또 나오면 순번). 다른 항목이 생기거나 사라져도 그대로라 점검 목록이 끄는 동안 다시 그려지지 않습니다.

## 방 모양

사각형에서 모서리를 잘라 내는 방식(`RoomData.cutouts`)입니다. 네 모서리까지 자를 수 있어 ㄱ자, ㄴ자, T자, 십자형을 만들 수 있습니다. ㄷ자처럼 벽 중간이 들어간 방과 임의의 다각형은 지원하지 않고, 문·창문·콘센트는 바깥쪽 네 벽의 남은 구간에만 놓습니다.

## 공유 링크와 평면도 이미지

- 공유 링크는 배치도를 `deflate-raw`로 압축해 주소의 해시에 넣습니다. 해시는 서버로 전송되지 않으며, 받을 때 파일 불러오기와 같은 검사를 거칩니다. 금액과 평면도 이미지는 넣지 않습니다.
- 평면도 이미지는 긴 변 2000px의 JPEG로 줄여 배치도와 함께 IndexedDB에 저장하고, JSON 내보내기에 포함합니다.

## 여러 탭

같은 배치도를 여러 탭에서 열어도 변경을 잃지 않게 맞춥니다(`entities/plan/api/plan-sync.ts`).

- `savePlan`·`deletePlan`은 저장한 뒤 `BroadcastChannel('v-plans')`로 `{ type, id, updatedAt }`를 알립니다. 같은 채널 객체가 보낸 메시지는 자기에게 오지 않으므로 탭마다 채널 하나를 씁니다.
- 편집 화면은 자기가 마지막으로 불러오거나 저장한 `updatedAt`보다 늦은 저장을 받으면, 저장하지 않은 변경(저장에 실패한 변경 포함)·저장 중인 요청·끌기가 없을 때만 최신 내용으로 바꿉니다(`EditorSession.replaceWith`). 화면 위치와 선택은 두고 되돌리기 기록과 찍던 축척 점은 비웁니다. 불러온 내용을 다시 저장하지 않도록 자동 저장의 비교 기준도 맞춥니다.
- 바빠서 미룬 동기화는 저장이 끝나거나 끌기가 끝나면(옮기지 않고 놓아도) 다시 합니다(`hasGesture`는 반응형).
- `updatedAt`은 변경을 캡처한 때가 아니라 저장소에 쓰는 때의 시각입니다. 늦게 쓴 쪽이 늦은 시각을 가져 다른 탭이 그 저장을 받아들입니다.
- 자동 저장 타이머는 내용이 바뀔 때만 다시 겁니다. 숨김·닫힘 때의 즉시 저장은 타이머를 먼저 지워 같은 내용을 두 번 쓰지 않습니다.
- 자동 저장의 비교 문자열(`planFingerprint`)에서 저장 시각과 내 제품 정의(`customEntries`)는 뺍니다. 정의는 공용 등록 Map에서 오므로, 다른 탭에서 고친 정의를 다시 읽는 것만으로 이 탭의 옛 배치를 저장해 다른 탭의 배치를 덮지 않게 합니다. 정의는 배치가 바뀌어 저장할 때 함께 담기고, 첫 화면 미리보기는 저장소의 최신 정의로 그립니다.
- 양쪽에서 동시에 고치면 나중에 저장한 쪽이 남고, 다른 쪽이 그 내용을 불러옵니다.
- 삭제를 받으면 "배치도가 삭제되었습니다" 화면을 보여 줍니다. 저장하지 않은 변경이 있으면 그 탭의 저장이 배치도를 되살립니다.
- 탭이 다시 보이거나(`visibilitychange`) 뒤로 가기 캐시에서 돌아오면(`pageshow`) 저장 시각을 비교해 놓친 변경을 불러옵니다. 화면이 숨겨질 때는 기다리던 자동 저장을 바로 합니다(휴대폰에서 앱을 바꾼 뒤 정리되어도 남게).
- 첫 화면 목록은 보이면 0.3초 뒤 다시 읽고, 숨겨졌으면 다시 보일 때 한 번만 읽습니다.
- 내 제품을 등록·고치기·삭제하면 `{ type: 'products' }`를 알리고, 물건 목록(`CatalogPanel`)이 저장소에서 다시 읽습니다(놓은 물건의 그림·치수도 바뀜). 배치도를 다시 불러올 때도 배치도에 담긴 사본은 없는 내 제품만 채우므로 저장소의 정의를 다시 읽습니다.
- 배치도 이름을 비우면 마지막으로 확정한 이름(불러올 때나 입력란을 떠날 때의 이름)으로 저장하고, 입력란을 떠나면 그 이름으로 되돌립니다(`EditorSession.savedName`, `commitName`). 한 글자씩 지우는 중간 값은 확정하지 않습니다.

## 전체 백업과 복제

- 백업 파일은 `{ format: 'v-backup', version: 1, exportedAt, plans, products }`입니다(`entities/plan/model/backup.ts`). 첫 화면 "전체 백업"이 저장소의 모든 배치도(평면도 이미지 포함)와 내 제품을 담습니다. 배치도가 없어도 내 제품이 있으면 버튼이 있고, 내 제품을 읽지 못하면 빠진 백업이 되므로 내려받지 않습니다.
- 내려받은 파일은 언제나 다시 가져올 수 있어야 하므로, 가져오기 한도(파일당 배치도 500개, 256MB)를 넘으면 `splitBackup`이 배치도를 빠짐없이 여러 파일(`v-backup-<날짜>-1.json` …)로 나눕니다. 내 제품은 첫 파일에 담습니다.
- "JSON 불러오기"는 `parseImportFile`로 백업 파일인지 배치도 파일인지 가립니다. 배치도 파일은 지금처럼 새 배치도로 열고, 백업은 배치도마다 배치도 파일과 같은 검사(`parsePlanData`)를 거쳐 새 id로 추가합니다(마지막으로 고친 순서를 지키도록 저장 시각은 그대로). 잘못된 배치도·내 제품은 건너뛰고 수를 알립니다. 배치도는 500개, 내 제품은 500개까지 한 번에 가져오고, 파일은 256MB까지 읽습니다. 날짜로 쓸 수 없거나 미래인 저장 시각은 지금으로 바꾸고(목록의 날짜 서식이 멈추지 않게), 파일을 읽기 전에 잠가 같은 파일을 빨리 또 골라도 한 번만 가져옵니다.
- 저장은 배치도와 내 제품 저장소를 한 트랜잭션으로 묶어(`restoreBackup`), 내 제품이 한도를 넘거나 저장 공간이 모자라면 아무것도 저장하지 않습니다.
- 복제(`copyPlan`)는 배치도를 통째로 복사해 새 id와 "<이름> 사본"(60자 안)을 붙입니다.

## 거리 재기와 그림 저장

- 거리 재기는 `FloorPlan`의 화면 도구라 저장하지 않고 되돌리기 기록에도 남지 않습니다. 켜면 포인터를 누를 때 물건을 잡지 않고(캡처 단계에서 전파와 기본 동작을 막아 초점·선택도 바뀌지 않음) 점만 찍습니다. 5cm 격자, Shift면 그대로. 두 번째 손가락은 받지 않습니다. 축척 맞추기를 시작하면 꺼집니다.
- 키보드로는 도면 왼쪽 위의 십자선 버튼(안내 글자 상자)을 씁니다. 키보드로 켜면 이 버튼으로 초점이 가고, 방향키로 십자선을 10cm(Shift 1cm)씩 옮기며 Enter·Space로 점을 찍습니다. Esc로 끝내면 켜기 버튼으로 초점이 돌아갑니다. 포인터는 이 버튼을 지나쳐 도면을 직접 누릅니다.
- 그림 저장(`renderPlanImage`)은 미리보기(`PlanPreview`, 물건 이름 포함)를 화면 밖에 잠깐 그려 계산된 스타일을 요소마다 `style`로 옮긴 SVG를 캔버스에 그려 PNG로 만듭니다. 그림 안에서는 웹 글꼴을 받지 못해 운영체제 글꼴을 씁니다. 1cm에 2px로 그려 2배 해상도로 저장하고, 긴 변은 4096px까지입니다. X-ray는 방 바깥까지 치수를 그리므로 여백을 20cm로 넓힙니다(평소 8cm).

## 내 제품 등록

- 직접 등록한 제품은 IndexedDB의 `custom-products` 저장소에 두고, 카탈로그 조회(`getCatalogEntry`)는 내장 카탈로그 다음에 등록 제품을 찾습니다. 등록 제품은 `SvelteMap`에 있어 고치면 이미 놓은 물건의 그림과 점검이 바로 바뀝니다.
- 배치도를 저장할 때 쓰인 등록 제품의 정의를 `customEntries`로 함께 담습니다. 파일과 공유 링크를 받은 쪽은 이 정의로 제품을 등록해 엽니다. 이미 같은 id의 정의가 있으면 덮지 않아, 내가 고친 최신 정의가 옛 사본에 밀리지 않습니다.
- 층·분류·받침 여부는 사용자가 아니라 종류(`KIND_PRESETS`)가 정하고, 파일에서 온 값도 종류에서 다시 계산합니다.
- 등록 목록만 옮길 때는 `{ format: 'v-custom-products', version: 1, products }` 형식의 JSON을 씁니다(`stringifyCustomProducts`, `parseCustomProductsFile`). 배치도 파일을 넣으면 그 안의 `customEntries`를 꺼냅니다. 사용자가 고른 파일이므로 같은 id는 파일 내용으로 바꾸고, 잘못된 항목은 건너뛴 수를 알립니다. 저장은 한 트랜잭션으로 해서 일부만 저장되지 않습니다(`saveCustomProducts`). 내 제품은 브라우저마다 500개(`CUSTOM_PRODUCT_LIMIT`)까지 두며, 등록이나 가져오기로 이 수를 넘으면 `CustomProductLimitError`로 아무것도 저장하지 않습니다. 그래서 내보낸 파일은 항상 다시 가져올 수 있습니다.

## 물건 목록

- 카탈로그가 200개를 넘어 분류는 접어 두고, 검색어가 있으면 결과가 있는 분류를 모두 펼칩니다. 접고 편 상태는 검색하지 않을 때만 기억합니다.
- 최근 추가한 물건은 `localStorage`의 `v-recent-items`에 id 6개까지 둡니다. 읽기와 쓰기는 모두 `try/catch`로 감쌉니다. 저장된 값을 읽을 수 없거나 깨져 있으면 빈 목록으로 시작하고, 쓰기에 실패하면 그 화면에서는 목록이 보이지만 새로 고치면 사라집니다. 물건 한도에 걸려 놓지 못한 물건은 기록하지 않습니다.

## 글꼴

제목과 본문은 Barlow Condensed(영문·숫자)와 해바라기(한글), 치수는 IBM Plex Mono입니다. `src/app/styles/global.css`의 `--font-sans`·`--font-display`가 `'Barlow Condensed', 'Sunflower', …` 순서입니다.

- 해바라기는 저장소에 넣어 제공합니다. 원본(500·700)과 라이선스는 `scripts/fonts/sunflower/`, 설정은 `scripts/fonts/config.json`에 있습니다.
- `pnpm fonts`가 두 가지를 만듭니다.
  - `src/app/styles/fonts/sunflower.css`, `sunflower/sunflower-<굵기>-ui.woff2`: 소스(`.ts` 문자열, `.svelte`, JSON)에 쓰인 한글·기호만 담은 파일입니다. `+layout.svelte`가 불러와 첫 화면과 함께 받습니다.
  - `static/fonts/sunflower-rest.css`, `sunflower/sunflower-<굵기>-<번호>.woff2`: 나머지 글자를 Google Fonts 한국어 글꼴과 같은 글자 묶음으로 나눈 조각입니다. `attachRestFonts`가 페이지를 다 받고 1초 뒤 한가할 때 붙이고, 브라우저는 화면에 쓴 글자(사용자가 입력한 제품 이름 등)가 든 조각만 받습니다.
- 화면 글자를 바꾸면 `pnpm fonts`를 다시 실행합니다. 빠진 글자가 있으면 `src/app/styles/fonts.test.ts`가 실패합니다(`.svelte`는 주석 글자도 셉니다).

## CI

`.github/workflows/ci.yml`이 포맷, ESLint, Steiger, 타입, 단위 테스트, 빌드, Storybook 빌드, E2E를 차례로 실행합니다.

## 배포

Vercel 프로젝트 `v-setup-planner`에 정적 결과물(`build/`)을 배포합니다. `main`에 병합하면 프로덕션에 배포됩니다(PR 미리보기는 아래처럼 꺼 둠). 배치도 편집 주소는 `vercel.json`의 `routes`로 `spa.html`을 내려 주고, 없는 주소는 같은 내용의 `404.html`을 404 상태로 내려 줘 앱의 오류 화면이 뜹니다. Vercel이 Svelte를 감지하면 없는 주소에 `index.html`을 내려 주므로, `rewrites` 대신 끝에 404를 명시한 `routes`를 씁니다. `routes`를 쓰면 `headers`를 함께 쓸 수 없어, 응답 헤더도 `continue: true`인 경로로 붙입니다.

| 경로                                                        | 헤더                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 모든 응답                                                   | `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` |
| `/_app/immutable/*` (이름에 해시가 있는 파일)               | `Cache-Control: public, max-age=31536000, immutable`                                                                                                                                 |
| `/fonts/*`, `/brand/*`, 아이콘, `og-image.jpg`              | `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (파일을 바꾸면 하루 안에 새 파일로 바뀜. 급하면 이름을 바꿈)                                                   |
| HTML, `service-worker.js`, `manifest.webmanifest` 등 나머지 | Vercel 기본값(`max-age=0, must-revalidate`): 매번 새 버전인지 확인                                                                                                                   |

## 보안 (CSP)

`vite.config.ts`의 `csp`(해시 방식)가 미리 그린 페이지와 대체 페이지(`spa.html`, `404.html`)마다 `<meta http-equiv="content-security-policy">`를 넣습니다.

- 스크립트는 같은 출처와 해시만 허용합니다. SvelteKit이 만드는 인라인 스크립트(시작 코드, 서비스 워커 등록)의 해시는 SvelteKit이 더하고, `src/app.html`의 테마 스크립트 해시는 빌드할 때 다시 계산합니다.
- 인라인 스타일은 허용합니다(미리 그린 HTML의 `style` 속성). 이미지는 `data:`(평면도 이미지)·`blob:`까지, 연결은 같은 출처만 허용하고 `VITE_SENTRY_DSN`이 있으면 그 수집 주소를 더합니다.
- `<meta>`에서 쓸 수 없는 `frame-ancestors`는 응답 헤더로 보냅니다(위 표).
- E2E가 첫 화면·편집 화면(평면도 이미지 포함)·공유 화면·오류 화면에서 `securitypolicyviolation`이 없는지 확인합니다. 외부 스크립트·이미지를 새로 쓰면 지시어를 함께 고칩니다.

## 오프라인과 설치 (PWA)

배치도는 원래 브라우저에만 있으므로, 앱 파일을 저장해 두면 네트워크 없이도 만들고 고칠 수 있습니다.

- **매니페스트**: `static/manifest.webmanifest`(이름, `standalone`, 아이콘 192·512·마스크용 512). 512 아이콘은 `pnpm icons`가 `scripts/brand/letter-v-512.png`(Flaticon 원본 512px)로 지금 아이콘과 같은 비율로 만듭니다.
- **서비스 워커**: `src/service-worker/index.ts`. SvelteKit 3에서는 `$app/service-worker`(`self`), `$app/manifest`(`immutable`·`assets`·`prerendered`), `$app/env`(`version`)를 씁니다. 타입 검사는 따로 둔 `src/service-worker/tsconfig.json`(`$app/tsconfig/service-worker`)으로 하고(`pnpm check`에 포함), 루트 `tsconfig.json`과 Steiger에서는 뺍니다.
  - 설치할 때 앱 코드·스타일, 영문·라틴 확장 글꼴과 한글 화면 글자 글꼴, 첫 화면·공유 화면·`spa.html`, 아이콘을 저장합니다(약 0.7MB). 한글 글꼴 조각(`/fonts/sunflower/*`)과 다른 문자 묶음 글꼴은 쓸 때 받아 같은 버전 저장소에 둡니다(조각 목록 CSS는 화면 글자가 바뀌면 내용이 바뀌므로 버전과 함께 정리).
  - 페이지 이동은 네트워크를 먼저 쓰고, 오프라인이거나 4초 안에 답이 없으면 저장본을 줍니다(`/plans/*`는 `spa.html`). 온라인이면 새로 고칠 때 바로 새 버전을 받습니다.
  - 해시 파일은 저장본을 먼저 씁니다. 새 버전이 활성화되면 이전 버전의 저장본을 지웁니다(`v-app-<version>`).
  - 개발 서버(`pnpm dev`)에서는 요청을 가로채지 않습니다.
- E2E가 서비스 워커가 맡은 뒤 오프라인으로 바꿔 첫 화면·편집 화면이 열리고 고친 내용이 남는지 확인합니다.

## 저장 공간 보호

브라우저는 저장 공간이 모자라거나 사이트를 한동안 쓰지 않으면(Safari는 7일, 홈 화면 앱은 예외) 사이트 데이터를 지울 수 있습니다. 배치도를 새로 만들거나 공유 링크에서 복사할 때 `navigator.storage.persist()`를 요청합니다(`shared/lib/storage`의 `protectStorage`). 이미 보호되었으면 다시 묻지 않고, 파이어폭스는 허용 여부를 한 번 묻습니다.

## 검색과 공유 미리보기

`shared/ui`의 `PageMeta`가 화면마다 제목·설명과 OG·트위터 메타를 넣습니다. OG 주소와 `canonical`은 절대 주소여야 해서 `shared/config`의 운영 주소(`SITE.url`)를 씁니다. 주소가 바뀌면 이 값과 `static/robots.txt`·`static/sitemap.xml`을 함께 고칩니다.

- 첫 화면은 `canonical`을 넣고, 공유·편집·오류 화면은 `noindex`입니다. `robots.txt`는 편집 화면(`/plans/`)을 수집하지 않게 합니다.
- 공유 미리보기 그림 `static/og-image.jpg`(1200×630)는 `pnpm screenshots`가 README 화면과 함께 다시 찍습니다.

## 품질 예산

- **번들 크기:** `pnpm size`가 전체 JS 120 kB, CSS 42 kB(gzip)를 넘으면 실패합니다. 기준은 `.size-limit.json`에 있습니다. 모든 조각의 합계라 지연 로딩으로는 줄지 않습니다. 0.12.0에서 오프라인·탭 동기화·백업·그림 저장·거리 재기로 115 kB를 넘어 120 kB로 올렸습니다(화면별 첫 로딩은 첫 화면 약 88 kB, 편집 약 87 kB로 Lighthouse 100점 그대로).
- **Lighthouse:** `pnpm lhci`가 첫 화면과 공유 화면이 데스크톱 기준 성능 90·접근성 100·권장 사항 95·SEO 90점(공유 화면은 noindex라 SEO 제외), LCP 2.5초·TBT 200ms·CLS 0.1 이하인지 3번씩 재서 확인합니다. 기준은 `lighthouserc.json`에 있습니다.

Svelte 컴파일러의 접근성 경고는 `eslint-plugin-svelte`의 `svelte/valid-compile`과 `svelte-check`가 이미 검사합니다.

두 검사 모두 프로덕션 빌드가 먼저 있어야 하며, CI는 빌드 뒤에 돌립니다.

## 모니터링

`src/hooks.client.ts`가 화면을 그리기 전에 `app/monitoring`을 켜고(SvelteKit이 오류 화면으로 바꾼 오류는 `handleError`에서 보냄), Sentry와 web-vitals는 나중에 따로 받습니다. Sentry는 페이지를 다 받은 뒤(load) 브라우저가 한가할 때 받고, load가 10초 안에 오지 않으면 그때 바로 받습니다.

| 환경 변수         | 내용                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SENTRY_DSN` | 있으면 처리하지 못한 오류와 나쁜(poor) Web Vitals를 Sentry로 보냅니다. 없으면 Sentry를 번들에 넣지 않고, 개발 모드에서 Web Vitals를 콘솔에만 찍습니다 |

- Sentry에는 오류 내용만 보내고 사용자 정보·쿠키·헤더·쿼리 문자열, 방문 기록(세션), 이동·클릭 기록(브레드크럼), 콘솔 기록은 모으지 않습니다. 오류에 붙는 콜백 인수, Error가 아닌 일반 객체로 거부된 Promise의 필드 값(`extra.__serialized__`), 주소의 `#` 뒤도 보내기 전에 지웁니다. Sentry를 받기 전에 난 오류는 20개까지 모아 두었다가 처리되지 않은 오류로 보냅니다.
- 쓰는 함수만 `sentry.ts`에서 다시 내보내 약 31 kB(gzip)로 받습니다. 모듈 전체를 불러오면 리플레이·피드백까지 들어가 140 kB가 됩니다.
- 브라우저 오류만 모읍니다. 서버에서 난 오류는 호스팅(Vercel 등)의 로그로 확인합니다.

## 의존성 갱신 (Dependabot)

`.github/dependabot.yml`이 npm 패키지는 매주 부 버전·패치를 한 PR로 묶어 올리고, GitHub Actions는 매달 올립니다. 주 버전은 따로 PR이 열리므로 변경 내역을 확인하고 CI가 통과할 때만 병합합니다.

## PR 미리보기 배포

Vercel의 하루 배포 한도를 아끼려고 PR 미리보기 배포를 껐습니다(`vercel.json`의 `git.deploymentEnabled`). `main`에 머지할 때만 운영으로 배포하고, PR에서는 CI 검사만 돕니다. 미리보기가 꼭 필요하면 그 브랜치를 `deploymentEnabled`에 잠시 넣습니다.
