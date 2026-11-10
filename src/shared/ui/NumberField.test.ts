import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NumberField from './NumberField.svelte';

function setup() {
	const oncommit = vi.fn();
	render(NumberField, { label: '가로', value: 100, min: 10, max: 200, unit: 'cm', oncommit });
	return { oncommit, input: screen.getByLabelText('가로') as HTMLInputElement };
}

describe('NumberField', () => {
	it('범위 안의 값을 확정합니다', async () => {
		const { oncommit, input } = setup();
		await userEvent.clear(input);
		await userEvent.type(input, '150');
		await userEvent.tab();
		expect(oncommit).toHaveBeenCalledWith(150);
	});

	it('소수를 한 글자씩 입력해도 지우지 않습니다', async () => {
		const { oncommit, input } = setup();
		await userEvent.clear(input);
		await userEvent.type(input, '29.4');
		expect(input.value).toBe('29.4');
		await userEvent.tab();
		expect(oncommit).toHaveBeenCalledWith(29.4);
	});

	it('위아래 방향키로 값을 바꿉니다', async () => {
		const { oncommit, input } = setup();
		input.focus();
		await userEvent.keyboard('{ArrowUp}');
		expect(oncommit).toHaveBeenCalledWith(101);
	});

	it('범위를 벗어나면 오류를 연결하고 확정하지 않습니다', async () => {
		const { oncommit, input } = setup();
		await userEvent.clear(input);
		await userEvent.type(input, '999');
		await userEvent.tab();
		expect(oncommit).not.toHaveBeenCalled();
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
			'10~200cm 사이로 입력해 주세요.'
		);
	});
});
