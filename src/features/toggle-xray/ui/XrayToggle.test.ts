import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { xray } from '../model/xray.svelte';
import XrayToggle from './XrayToggle.svelte';

describe('XrayToggle', () => {
	it('누르면 문서에 표시하고 다시 누르면 해제합니다', async () => {
		render(XrayToggle);
		const button = screen.getByRole('button', { name: 'X-ray' });
		await userEvent.click(button);
		expect(xray.on).toBe(true);
		expect(button.getAttribute('aria-pressed')).toBe('true');
		expect(document.documentElement.dataset.xray).toBe('on');
		await userEvent.click(button);
		expect(document.documentElement.dataset.xray).toBeUndefined();
	});
});
