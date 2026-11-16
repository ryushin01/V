/**
 * 오프라인에서도 열리게 하는 서비스 워커입니다. 배치도는 원래 브라우저(IndexedDB)에만 있으므로
 * 앱 파일만 저장해 두면 네트워크 없이도 만들고 고칠 수 있습니다.
 *
 * - 설치할 때: 앱 코드·스타일, 첫 화면 글꼴, 페이지(첫 화면, 공유 화면, 편집 화면 대체 페이지), 아이콘을 저장합니다.
 * - 페이지 이동: 네트워크를 먼저 쓰고, 오프라인이거나 4초 안에 답이 없으면 저장본을 줍니다.
 * - 해시 파일(_app/immutable)과 한글 글꼴 조각: 저장본을 먼저 쓰고, 없으면 받아서 저장합니다.
 * - 새 버전이 활성화되면 이전 버전의 저장본을 모두 지웁니다. 글꼴 조각 목록(sunflower-rest.css)은 화면 글자가
 *   바뀌면 내용이 바뀌므로, 글꼴도 버전별 저장소에 두어 옛 목록이 남지 않게 합니다(쓴 조각만 다시 받음).
 */
import { dev, version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

const APP_CACHE = `v-app-${version}`;
const NAVIGATION_TIMEOUT_MS = 4000;
/** 편집 화면(/plans/…)처럼 미리 그리지 않은 주소에 줄 대체 페이지입니다. */
const FALLBACK_PAGE = '/spa.html';

const toUrl = (path: string) => (path.startsWith('/') ? path : `/${path}`);

/** 영문·라틴 확장 글꼴과 화면 글자 한글 글꼴만 미리 받고, 다른 문자 묶음은 쓸 때 받습니다. */
const isPrecachedFont = (path: string) =>
	/\.woff2$/.test(path) && !/(cyrillic|greek|vietnamese)/.test(path);

const PRECACHE = [
	...immutable
		.map(({ path }) => toUrl(path))
		.filter((path) => !/\.(woff2?|ttf|otf)$/.test(path) || isPrecachedFont(path)),
	...prerendered.map(({ path }) => toUrl(path)),
	FALLBACK_PAGE,
	// static 폴더에서는 아이콘·매니페스트·글꼴 조각 목록 CSS만 (글꼴 조각 파일 100여 개는 쓸 때 받음)
	...assets
		.map(({ path }) => toUrl(path))
		.filter((path) => !path.startsWith('/fonts/sunflower/') && !/\.(txt|xml|jpg)$/.test(path))
];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== APP_CACHE).map((key) => caches.delete(key)))
			)
	);
});

/** 오프라인일 때 이 주소 대신 줄 저장본입니다. */
function offlinePage(pathname: string): string {
	if (pathname === '/' || pathname === '/shared') return pathname;
	return FALLBACK_PAGE;
}

async function navigate(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(APP_CACHE);
	const saved = await cache.match(offlinePage(url.pathname));
	const network = fetch(request);
	if (!saved) return network;
	// 저장본이 있으면 네트워크가 실패하거나 너무 오래 걸릴 때 저장본을 줍니다.
	const timeout = new Promise<Response>((resolve) =>
		setTimeout(() => resolve(saved.clone()), NAVIGATION_TIMEOUT_MS)
	);
	return Promise.race([network.catch(() => saved.clone()), timeout]);
}

/** 저장본을 먼저 쓰고, 없으면 받아서 저장합니다. */
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const saved = await cache.match(request);
	if (saved) return saved;
	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (dev || request.method !== 'GET') return;
	const url = new URL(request.url);
	// 다른 출처(Sentry 등)와 범위 요청은 그대로 둡니다.
	if (url.origin !== self.location.origin || request.headers.has('range')) return;

	if (request.mode === 'navigate') {
		event.respondWith(navigate(request, url));
	} else if (url.pathname.startsWith('/_app/immutable/') || url.pathname.startsWith('/fonts/')) {
		event.respondWith(cacheFirst(request, APP_CACHE));
	} else if (PRECACHE.includes(url.pathname)) {
		event.respondWith(caches.match(url.pathname).then((saved) => saved ?? fetch(request)));
	}
});
