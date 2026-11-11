import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
	createCustomEntry,
	createEmptyPlan,
	getCatalogEntry,
	listCustomProducts,
	stringifyCustomProducts
} from '#entities/plan';
import { EditorSession } from '../model/session.svelte';
import CatalogPanel from './CatalogPanel.svelte';

const jsonFile = (text: string, name = 'mine.json') =>
	new File([text], name, { type: 'application/json' });

function setup() {
	const session = new EditorSession(createEmptyPlan());
	const { container } = render(CatalogPanel, { session });
	const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
	return { session, input };
}

// 카탈로그 200여 항목을 그리고 IndexedDB에 저장하므로, 병렬 실행에서도 넉넉히 기다립니다.
const SLOW = { timeout: 5_000 };

describe('CatalogPanel 내 제품 파일', { timeout: 20_000 }, () => {
	it('파일에서 내 제품을 가져와 목록과 카탈로그에 넣습니다', async () => {
		const { session, input } = setup();
		const entry = createCustomEntry({
			id: 'custom-imported-lamp',
			name: '가져온 조명',
			brand: '',
			kind: 'decor',
			width: 12,
			depth: 12,
			watts: 0,
			cable: 0,
			glyph: ''
		});
		await userEvent.upload(input, jsonFile(stringifyCustomProducts([entry])));
		expect(await screen.findByText('가져온 조명', {}, SLOW)).toBeInTheDocument();
		expect(session.announcement).toBe('내 제품을 가져왔습니다. 새 제품 1개.');
		expect(getCatalogEntry('custom-imported-lamp').name).toBe('가져온 조명');
		expect((await listCustomProducts()).some((item) => item.id === entry.id)).toBe(true);
		// 목록이 생기면 내보내기 버튼이 나타납니다.
		expect(screen.getByRole('button', { name: '파일로 내보내기' })).toBeInTheDocument();
	});

	it('읽을 수 없는 파일은 이유를 알립니다', async () => {
		const { input } = setup();
		await userEvent.upload(input, jsonFile('{"hello":1}'));
		expect(await screen.findByRole('alert', {}, SLOW)).toHaveTextContent(
			'내 제품 파일이나 배치도 파일이 아닙니다.'
		);
	});

	it('가져오기 버튼이 파일 선택을 엽니다', async () => {
		const { input } = setup();
		let opened = false;
		input.addEventListener('click', () => (opened = true));
		await userEvent.click(screen.getByRole('button', { name: '파일에서 가져오기' }));
		await waitFor(() => expect(opened).toBe(true));
	});
});

describe('CatalogPanel 최근 추가한 물건', { timeout: 20_000 }, () => {
	it('놓은 물건을 맨 위에 모으고 다시 열어도 기억합니다', async () => {
		localStorage.clear();
		const first = setup();
		await userEvent.click(screen.getAllByRole('button', { name: /^책상 140/ })[0]);
		expect(first.session.items).toHaveLength(1);
		const recent = document.querySelector('details.recent');
		expect(recent?.textContent).toContain('책상 140');
		expect(JSON.parse(localStorage.getItem('v-recent-items') ?? '[]')).toEqual(['desk-140']);
	});

	it('저장된 값이 깨져 있어도 목록 없이 동작합니다', () => {
		localStorage.setItem('v-recent-items', '{깨짐');
		setup();
		expect(document.querySelector('details.recent')).toBeNull();
		expect(screen.getByRole('heading', { name: '물건 추가' })).toBeInTheDocument();
	});
});
