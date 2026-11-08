import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Dialog from './Dialog.svelte';

describe('Dialog', () => {
	it('open이면 모달로 열고 제목을 이름으로 연결합니다', () => {
		const showModal = vi.fn(function (this: HTMLDialogElement) {
			this.setAttribute('open', '');
		});
		HTMLDialogElement.prototype.showModal = showModal;
		const { container } = render(Dialog, {
			open: true,
			title: '단축키',
			children: createRawSnippet(() => ({ render: () => '<p>내용</p>' }))
		});
		expect(showModal).toHaveBeenCalled();
		const dialog = container.querySelector('dialog');
		const heading = document.getElementById(dialog?.getAttribute('aria-labelledby') ?? '');
		expect(heading?.textContent).toBe('단축키');
	});
});
