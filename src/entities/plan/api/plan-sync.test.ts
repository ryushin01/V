import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyPlan } from '../model/factory';
import { onPlanChange, type PlanChange } from './plan-sync';
import { deletePlan, savePlan } from './plans-db';

/** 다른 탭을 흉내 내는 채널입니다. 같은 이름의 다른 채널 객체끼리 메시지를 주고받습니다. */
const otherTab = new BroadcastChannel('v-plans');
(otherTab as BroadcastChannel & { unref?: () => void }).unref?.();

/** 메시지는 비동기로 오므로, 앞서 보낸 다른 종류의 알림은 건너뜁니다. */
function nextMessage(type: PlanChange['type']): Promise<PlanChange> {
	return new Promise((resolve) => {
		otherTab.onmessage = (event: MessageEvent) => {
			if ((event.data as PlanChange).type === type) resolve(event.data as PlanChange);
		};
	});
}

afterEach(() => {
	otherTab.onmessage = null;
});

describe('배치도 변경 알림', () => {
	it('저장하면 다른 탭에 id와 저장 시각을 알립니다', async () => {
		const plan = { ...createEmptyPlan(), updatedAt: 1234 };
		const message = nextMessage('saved');
		await savePlan(plan);
		expect(await message).toEqual({ type: 'saved', id: plan.id, updatedAt: 1234 });
	});

	it('삭제하면 다른 탭에 알립니다', async () => {
		const plan = createEmptyPlan();
		await savePlan(plan);
		const message = nextMessage('deleted');
		await deletePlan(plan.id);
		expect(await message).toEqual({ type: 'deleted', id: plan.id });
	});

	it('다른 탭의 알림을 받고, 형식이 틀린 메시지는 버립니다', async () => {
		const listener = vi.fn();
		const stop = onPlanChange(listener);
		otherTab.postMessage({ type: 'saved', id: 'x' });
		otherTab.postMessage('잘못된 메시지');
		otherTab.postMessage({ type: 'deleted', id: 'plan-1' });
		await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
		expect(listener).toHaveBeenCalledWith({ type: 'deleted', id: 'plan-1' });
		stop();
		otherTab.postMessage({ type: 'deleted', id: 'plan-2' });
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
