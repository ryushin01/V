import { parsePlan, stringifyPlan, type ParseResult } from '../model/serialize';
import type { PlanData } from '../model/types';

/** 압축을 푼 결과의 상한입니다. 지나치게 부풀린 링크를 막습니다. */
const MAX_DECODED_BYTES = 512 * 1024;
const MAX_TOKEN_LENGTH = 100_000;
const INVALID: ParseResult = { ok: false, error: '링크가 손상되었거나 V 공유 링크가 아닙니다.' };

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): Uint8Array<ArrayBuffer> {
	const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function readLimited(stream: ReadableStream<Uint8Array>): Promise<Uint8Array | null> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.length;
		if (total > MAX_DECODED_BYTES) {
			await reader.cancel();
			return null;
		}
		chunks.push(value);
	}
	const merged = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.length;
	}
	return merged;
}

function pipe(
	bytes: Uint8Array<ArrayBuffer>,
	transform: ReadableWritablePair<Uint8Array, BufferSource>
) {
	return (new Response(bytes).body as ReadableStream<Uint8Array<ArrayBuffer>>).pipeThrough(
		transform as ReadableWritablePair<Uint8Array, Uint8Array>
	);
}

/** 금액은 링크에 넣지 않습니다. 해시는 서버로 전송되지 않습니다. */
export async function encodePlan(plan: PlanData): Promise<string> {
	const shared: PlanData = {
		...plan,
		underlay: undefined,
		items: plan.items.map((item) => ({ ...item, price: 0 }))
	};
	const text = new TextEncoder().encode(stringifyPlan(shared));
	const compressed = await readLimited(pipe(text, new CompressionStream('deflate-raw')));
	if (!compressed) throw new Error('배치도가 너무 큽니다.');
	return toBase64Url(compressed);
}

export async function decodePlan(token: string): Promise<ParseResult> {
	if (!token || token.length > MAX_TOKEN_LENGTH) return INVALID;
	try {
		const decoded = await readLimited(
			pipe(fromBase64Url(token), new DecompressionStream('deflate-raw'))
		);
		return decoded ? parsePlan(new TextDecoder().decode(decoded)) : INVALID;
	} catch {
		return INVALID;
	}
}
