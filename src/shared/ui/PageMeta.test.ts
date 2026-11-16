import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import PageMeta from './PageMeta.svelte';

const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute('content');

afterEach(() => {
	document.head.innerHTML = '';
});

describe('PageMeta', () => {
	it('제목과 공유 미리보기를 운영 주소 기준 절대 주소로 넣습니다', () => {
		render(PageMeta, { title: '공유된 배치도 | V', path: '/shared' });
		expect(document.title).toBe('공유된 배치도 | V');
		expect(meta('meta[property="og:title"]')).toBe('공유된 배치도 | V');
		expect(meta('meta[property="og:url"]')).toBe(
			'https://v-setup-planner-ryushin01.vercel.app/shared'
		);
		expect(meta('meta[property="og:image"]')).toBe(
			'https://v-setup-planner-ryushin01.vercel.app/og-image.jpg'
		);
		expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
		expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
			'href',
			'https://v-setup-planner-ryushin01.vercel.app/shared'
		);
	});

	it('검색에서 빼는 화면은 noindex를 넣고 canonical은 넣지 않습니다', () => {
		render(PageMeta, { title: '배치도 편집 | V', noindex: true });
		expect(meta('meta[name="robots"]')).toBe('noindex');
		expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
	});
});
