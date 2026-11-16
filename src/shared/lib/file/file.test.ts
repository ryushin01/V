import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadText, readTextFile } from './index';

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('readTextFile', () => {
	it('한도 안의 파일을 읽습니다', async () => {
		const file = new File(['{"version":1}'], 'plan.json', { type: 'application/json' });
		expect(await readTextFile(file, 1024)).toEqual({ ok: true, text: '{"version":1}' });
	});

	it('한도보다 크면 읽지 않고 이유를 알려 줍니다', async () => {
		const file = new File(['x'.repeat(3 * 1024 * 1024)], 'big.json');
		const text = vi.spyOn(file, 'text');
		const result = await readTextFile(file, 2 * 1024 * 1024);
		expect(result).toEqual({
			ok: false,
			error: '파일이 너무 큽니다(3MB). 2MB 이하의 파일을 골라 주세요.'
		});
		expect(text).not.toHaveBeenCalled();
	});

	it('읽다가 실패해도 던지지 않습니다', async () => {
		const file = new File(['{}'], 'gone.json');
		vi.spyOn(file, 'text').mockRejectedValue(new DOMException('NotFoundError'));
		expect(await readTextFile(file, 1024)).toEqual({
			ok: false,
			error: '파일을 읽지 못했습니다. 파일을 다시 골라 주세요.'
		});
	});
});

describe('downloadText', () => {
	it('파일 이름으로 내려받고 주소를 해제합니다', () => {
		vi.useFakeTimers();
		const create = vi.fn(() => 'blob:plan');
		const revoke = vi.fn();
		Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
			this: HTMLAnchorElement
		) {
			expect(this.download).toBe('거실.json');
			expect(this.href).toBe('blob:plan');
		});
		downloadText('거실.json', '{}');
		expect(click).toHaveBeenCalledTimes(1);
		expect(revoke).not.toHaveBeenCalled();
		vi.runAllTimers();
		expect(revoke).toHaveBeenCalledWith('blob:plan');
	});
});
