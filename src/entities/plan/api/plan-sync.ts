/** 같은 브라우저의 다른 탭에 알리는 배치도 저장·삭제와 내 제품 변경입니다. */
export type PlanChange =
	| { type: 'saved'; id: string; updatedAt: number }
	| { type: 'deleted'; id: string }
	| { type: 'products' };

const CHANNEL_NAME = 'v-plans';
const listeners = new Set<(change: PlanChange) => void>();
let channel: BroadcastChannel | null | undefined;

function parseChange(data: unknown): PlanChange | null {
	if (typeof data !== 'object' || data === null) return null;
	const { type, id, updatedAt } = data as Record<string, unknown>;
	if (type === 'products') return { type };
	if (typeof id !== 'string') return null;
	if (type === 'deleted') return { type, id };
	if (type === 'saved' && typeof updatedAt === 'number') return { type, id, updatedAt };
	return null;
}

/** 탭마다 채널 하나를 씁니다. 같은 채널 객체가 보낸 메시지는 자기에게 오지 않으므로 이 탭의 변경은 받지 않습니다. */
function getChannel(): BroadcastChannel | null {
	if (channel !== undefined) return channel;
	if (typeof BroadcastChannel === 'undefined') return (channel = null);
	channel = new BroadcastChannel(CHANNEL_NAME);
	channel.onmessage = (event: MessageEvent) => {
		const change = parseChange(event.data);
		if (change) for (const listener of listeners) listener(change);
	};
	// Node(단위 테스트)에서는 열린 채널이 프로세스를 붙잡지 않게 합니다. 브라우저에는 없는 함수입니다.
	(channel as BroadcastChannel & { unref?: () => void }).unref?.();
	return channel;
}

/** 다른 탭에 알립니다. 채널을 쓸 수 없는 브라우저에서는 조용히 넘어갑니다. */
export function announcePlanChange(change: PlanChange): void {
	try {
		getChannel()?.postMessage(change);
	} catch {
		// 알림은 편의 기능이라 실패해도 저장에는 영향이 없습니다.
	}
}

/** 다른 탭의 저장·삭제를 받습니다. 구독을 끊는 함수를 돌려줍니다. */
export function onPlanChange(listener: (change: PlanChange) => void): () => void {
	getChannel();
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
