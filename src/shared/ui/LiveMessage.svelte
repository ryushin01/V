<script lang="ts">
	interface Props {
		/** 보여 주고 읽어 줄 문구. 비어 있어도 영역은 남아 있어, 문구를 넣으면 화면 낭독기가 읽습니다. */
		message: string;
		/** alert: 바로 알려야 하는 오류(assertive), status: 결과·진행 안내(polite) */
		role?: 'alert' | 'status';
		/** error: 빨강 굵은 글자, note: 보조 글자색 */
		tone?: 'error' | 'note';
		/** 글자 크기(CSS 길이). 기본은 둘러싼 글자 크기입니다. */
		size?: string;
		/** 문구가 있을 때 아래쪽 간격(CSS 길이) */
		gap?: string;
		/** 같은 내용이 화면에 이미 보일 때 화면 낭독기에만 읽힙니다. */
		srOnly?: boolean;
		id?: string;
	}

	let {
		message,
		role = 'alert',
		tone = role === 'alert' ? 'error' : 'note',
		size,
		gap,
		srOnly = false,
		id
	}: Props = $props();
</script>

<!-- 상태 메시지는 영역을 처음부터 두고 내용만 바꿔야 고르게 읽힙니다. 비어 있으면 화면 흐름에서 빠집니다. -->
<p
	{id}
	{role}
	class={['live', tone, srOnly && 'sr-only']}
	style:font-size={size}
	style:--live-gap={gap}
>
	{message}
</p>

<style>
	.live {
		margin: 0;
	}

	.live:not(:empty) {
		margin-block-end: var(--live-gap, 0);
	}

	/* 비어 있을 때는 그리드·플렉스 간격을 만들지 않도록 흐름에서 빼되, 보조기술 트리에는 남깁니다. */
	.live:empty {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.error {
		font-weight: 500;
		color: var(--accent-deep);
	}

	.note {
		color: var(--ink-2);
	}
</style>
