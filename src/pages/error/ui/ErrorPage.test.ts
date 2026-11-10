import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ErrorPage from './ErrorPage.svelte';

describe('ErrorPage', () => {
	it('404는 없는 페이지임을 알리고 처음으로 안내합니다', () => {
		render(ErrorPage, { status: 404 });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('치수가');
		expect(screen.getByRole('link', { name: '처음으로' })).toBeInTheDocument();
	});

	it('그 밖의 오류는 다른 안내를 보여 줍니다', () => {
		render(ErrorPage, { status: 500 });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('다시 재');
	});
});
