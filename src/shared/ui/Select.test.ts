import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SelectExample from './SelectExample.svelte';

describe('Select', () => {
	it('레이블과 연결되고 고른 값을 바깥으로 돌려줍니다', async () => {
		const onchange = vi.fn();
		render(SelectExample, { onchange });
		const select = screen.getByRole('combobox', { name: '벽' }) as HTMLSelectElement;
		expect(select.value).toBe('east');
		await userEvent.selectOptions(select, 'south');
		expect(screen.getByTestId('value')).toHaveTextContent('south');
		expect(onchange).toHaveBeenCalledOnce();
	});

	it('직접 그린 화살표는 보조기술과 포인터에서 뺍니다', () => {
		const { container } = render(SelectExample);
		const arrow = container.querySelector('.arrow');
		expect(arrow).toHaveAttribute('aria-hidden', 'true');
		expect(arrow?.querySelector('svg')).toHaveAttribute('focusable', 'false');
	});
});
