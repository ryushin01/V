import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LiveMessage from './LiveMessage.svelte';

describe('LiveMessage', () => {
	it('문구가 없어도 영역을 두고, 문구를 넣으면 같은 영역에 채웁니다', async () => {
		const { rerender } = render(LiveMessage, { message: '' });
		const region = screen.getByRole('alert');
		expect(region.textContent).toBe('');
		await rerender({ message: '파일을 읽지 못했습니다.' });
		expect(screen.getByRole('alert')).toBe(region);
		expect(region).toHaveTextContent('파일을 읽지 못했습니다.');
	});

	it('결과 안내는 status 역할로 둡니다', () => {
		render(LiveMessage, { message: '두 번째 점을 눌러 주세요.', role: 'status' });
		expect(screen.getByRole('status')).toHaveTextContent('두 번째 점을 눌러 주세요.');
	});

	it('화면에 같은 내용이 있으면 화면 낭독기에만 읽힙니다', () => {
		render(LiveMessage, { message: '저장하지 못했습니다.', srOnly: true });
		expect(screen.getByRole('alert')).toHaveClass('sr-only');
	});
});
