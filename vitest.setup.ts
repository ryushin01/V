import '@testing-library/jest-dom/vitest';

// jsdom에 없는 브라우저 API입니다.
window.matchMedia ??= ((query: string) => ({
	matches: false,
	media: query,
	addEventListener: () => {},
	removeEventListener: () => {}
})) as unknown as typeof window.matchMedia;

globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
