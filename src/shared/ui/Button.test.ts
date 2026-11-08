import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Button from './Button.svelte';

const children = createRawSnippet(() => ({ render: () => '<span>저장</span>' }));

describe('Button', () => {
	it('기본은 submit이 아닌 button입니다', () => {
		render(Button, { children });
		expect(screen.getByRole('button', { name: '저장' }).getAttribute('type')).toBe('button');
	});

	it('href가 있으면 링크로 그립니다', () => {
		render(Button, { children, href: '/plans/1' });
		expect(screen.getByRole('link', { name: '저장' }).getAttribute('href')).toBe('/plans/1');
	});
});
