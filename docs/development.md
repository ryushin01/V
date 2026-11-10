# 개발 가이드

## 구조

Feature-Sliced Design v2.1을 따르며 `pnpm lint:fsd`(Steiger)로 검사합니다.

- SvelteKit 3에서 `kit.files`와 `kit.alias`가 deprecated되어, 계층은 `src/` 바로 아래에 두고 `src/routes`의 파일은 페이지를 렌더링만 합니다.
- 경로는 `package.json`의 `imports`로 지정합니다. `#entities/plan`은 `src/entities/plan/index.ts`로만 연결되므로 공개 API를 건너뛸 수 없습니다.
- 한 페이지에서만 쓰는 코드는 페이지 슬라이스에 둡니다. 편집 세션이 `pages/editor`에 있는 이유입니다.
- 컴포넌트 옆에 `*.stories.ts`와 테스트를 둡니다. 편집기 패널의 테스트는 `editor-panels.test.ts`에 모았습니다.

## runes 사용 방식

| 위치                     | 사용                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| `PlacedItem`             | 좌표·회전은 필드별 `$state`, 사각형과 범위는 `$derived`                |
| `EditorSession.analysis` | 방과 물건에서 파생되는 점검 결과 `$derived`                            |
| 되돌리기                 | `$state.snapshot`으로 기록하고, 기록 배열은 `$state.raw`로 통째로 교체 |
| `NumberField`            | 외부 값에서 파생되지만 입력 중에는 덮어쓰는 `$derived`                 |
| `EditorPage`             | 자동 저장은 `$effect`와 정리 함수로 지연                               |

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

## 방 모양

사각형에서 모서리를 잘라 내는 방식(`RoomData.cutouts`)입니다. 네 모서리까지 자를 수 있어 ㄱ자, ㄴ자, T자, 십자형을 만들 수 있습니다. ㄷ자처럼 벽 중간이 들어간 방과 임의의 다각형은 지원하지 않고, 문·창문·콘센트는 바깥쪽 네 벽의 남은 구간에만 놓습니다.

## 공유 링크와 평면도 이미지

- 공유 링크는 배치도를 `deflate-raw`로 압축해 주소의 해시에 넣습니다. 해시는 서버로 전송되지 않으며, 받을 때 파일 불러오기와 같은 검사를 거칩니다. 금액과 평면도 이미지는 넣지 않습니다.
- 평면도 이미지는 긴 변 2000px의 JPEG로 줄여 배치도와 함께 IndexedDB에 저장하고, JSON 내보내기에 포함합니다.

## 내 제품 등록

- 직접 등록한 제품은 IndexedDB의 `custom-products` 저장소에 두고, 카탈로그 조회(`getCatalogEntry`)는 내장 카탈로그 다음에 등록 제품을 찾습니다. 등록 제품은 `SvelteMap`에 있어 고치면 이미 놓은 물건의 그림과 점검이 바로 바뀝니다.
- 배치도를 저장할 때 쓰인 등록 제품의 정의를 `customEntries`로 함께 담습니다. 파일과 공유 링크를 받은 쪽은 이 정의로 제품을 등록해 엽니다. 이미 같은 id의 정의가 있으면 덮지 않아, 내가 고친 최신 정의가 옛 사본에 밀리지 않습니다.
- 층·분류·받침 여부는 사용자가 아니라 종류(`KIND_PRESETS`)가 정하고, 파일에서 온 값도 종류에서 다시 계산합니다.
- 등록 목록만 옮길 때는 `{ format: 'v-custom-products', version: 1, products }` 형식의 JSON을 씁니다(`stringifyCustomProducts`, `parseCustomProductsFile`). 배치도 파일을 넣으면 그 안의 `customEntries`를 꺼냅니다. 사용자가 고른 파일이므로 같은 id는 파일 내용으로 바꾸고, 잘못된 항목은 건너뛴 수를 알립니다. 저장은 한 트랜잭션으로 해서 일부만 저장되지 않습니다(`saveCustomProducts`).

## CI

`.github/workflows/ci.yml`이 포맷, ESLint, Steiger, 타입, 단위 테스트, 빌드, Storybook 빌드, E2E를 차례로 실행합니다.

## 배포

Vercel 프로젝트 `v-setup-planner`에 정적 결과물(`build/`)을 배포합니다. `main`에 병합하면 프로덕션에, PR을 열면 미리보기에 배포됩니다. 배치도 편집 주소는 `vercel.json`의 `routes`로 `spa.html`을 내려 주고, 없는 주소는 같은 내용의 `404.html`을 404 상태로 내려 줘 앱의 오류 화면이 뜹니다. Vercel이 Svelte를 감지하면 없는 주소에 `index.html`을 내려 주므로, `rewrites` 대신 끝에 404를 명시한 `routes`를 씁니다.
