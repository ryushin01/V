import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getCatalogEntry, listCustomProducts } from '#entities/plan';
import CustomProductDialog from './CustomProductDialog.svelte';

beforeAll(() => {
	HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute('open', '');
	};
	HTMLDialogElement.prototype.close = function () {
		this.removeAttribute('open');
	};
});

function setup() {
	const onsaved = vi.fn();
	const ondeleted = vi.fn();
	render(CustomProductDialog, { open: true, editing: null, onsaved, ondeleted });
	return { onsaved, ondeleted };
}

describe('CustomProductDialog', () => {
	it('이름이 없으면 저장하지 않고 이유를 알립니다', async () => {
		const { onsaved } = setup();
		await userEvent.click(screen.getByRole('button', { name: '등록' }));
		expect(screen.getByLabelText('제품 이름 (필수)')).toHaveAccessibleDescription(
			'제품 이름을 입력해 주세요.'
		);
		expect(onsaved).not.toHaveBeenCalled();
	});

	it('입력한 치수와 그림으로 등록하고 더블 클릭해도 한 번만 저장합니다', async () => {
		const before = (await listCustomProducts()).length;
		const { onsaved } = setup();
		await userEvent.type(screen.getByLabelText('제품 이름 (필수)'), '내 키보드');
		await userEvent.selectOptions(screen.getByLabelText('종류'), 'keyboard');
		await userEvent.selectOptions(screen.getByLabelText('그림'), 'kb-60');
		const width = screen.getByLabelText('가로');
		await userEvent.clear(width);
		await userEvent.type(width, '29.4');
		await userEvent.tab();
		await userEvent.dblClick(screen.getByRole('button', { name: '등록' }));
		await waitFor(() => expect(onsaved).toHaveBeenCalledOnce());
		const [entry, place] = onsaved.mock.calls[0];
		expect(place).toBe(true);
		expect(getCatalogEntry(entry.id)).toMatchObject({
			name: '내 키보드',
			kind: 'keyboard',
			glyph: 'kb-60',
			width: 29.4
		});
		expect(await listCustomProducts()).toHaveLength(before + 1);
	});

	it('그림을 미리 보여 줍니다', () => {
		setup();
		expect(screen.getByRole('img', { name: /그림 미리보기/ })).toBeInTheDocument();
	});
});
