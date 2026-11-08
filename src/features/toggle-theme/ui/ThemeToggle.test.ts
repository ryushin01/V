import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle', () => {
	beforeEach(() => {
		delete document.documentElement.dataset.theme;
		vi.stubGlobal('matchMedia', () => ({ matches: false }));
	});

	it('누르면 다크 테마로 바꾸고 상태를 알립니다', async () => {
		render(ThemeToggle);
		const button = screen.getByRole('button', { name: '다크 테마' });
		expect(button.getAttribute('aria-pressed')).toBe('false');
		await userEvent.click(button);
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(button.getAttribute('aria-pressed')).toBe('true');
	});
});
