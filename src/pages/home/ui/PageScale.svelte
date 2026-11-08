<script lang="ts">
	import { onMount } from 'svelte';
	import type { ScrollTracker } from '../model/scroll.svelte';

	let { tracker }: { tracker: ScrollTracker } = $props();

	let root = $state<HTMLDivElement>();
	let height = $state(0);
	let dragging = $state(false);

	const THUMB = 8;
	const thumbY = $derived(Math.round(tracker.progress * Math.max(0, height - THUMB)));
	const labelY = $derived(Math.min(Math.max(thumbY - 8, 0), Math.max(0, height - 24)));

	onMount(() => {
		document.documentElement.classList.add('has-scale');
		return () => document.documentElement.classList.remove('has-scale');
	});

	function ratio(event: PointerEvent) {
		const rect = root?.getBoundingClientRect();
		return rect && rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;
	}

	function handleDown(event: PointerEvent) {
		event.preventDefault();
		dragging = true;
		root?.setPointerCapture?.(event.pointerId);
		tracker.scrollToProgress(ratio(event), false);
	}

	function handleMove(event: PointerEvent) {
		if (dragging) tracker.scrollToProgress(ratio(event), true);
	}

	function endDrag() {
		dragging = false;
	}
</script>

<!-- 스크롤바를 대신하는 시각 표현입니다. 휠, 터치, 키보드 스크롤은 그대로 동작합니다. -->
<div
	bind:this={root}
	bind:clientHeight={height}
	class="scale"
	class:is-dragging={dragging}
	aria-hidden="true"
	title="끌거나 눌러서 스크롤"
	data-testid="page-scale"
	onpointerdown={handleDown}
	onpointermove={handleMove}
	onpointerup={endDrag}
	onpointercancel={endDrag}
>
	<span class="label" style:transform={`translate3d(0, ${labelY}px, 0)`}>{tracker.section}</span>
	<div class="thumb" style:transform={`translate3d(0, ${thumbY}px, 0)`}></div>
</div>

<style>
	.scale {
		position: fixed;
		top: calc(var(--nav-h) + 8px);
		right: 6px;
		bottom: 16px;
		z-index: 90;
		width: 22px;
		background:
			repeating-linear-gradient(to bottom, var(--tick) 0 1px, transparent 1px 8px) right top / 5px
				100% no-repeat,
			repeating-linear-gradient(to bottom, var(--tick) 0 1px, transparent 1px 64px) right top / 12px
				100% no-repeat;
		cursor: grab;
		touch-action: none;
	}

	.scale.is-dragging {
		cursor: grabbing;
	}

	.thumb {
		position: absolute;
		top: 0;
		right: 4px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px var(--paper);
		will-change: transform;
	}

	.label {
		position: absolute;
		top: 0;
		right: 20px;
		padding: 5px 8px;
		border: 1px solid var(--line);
		border-radius: 4px;
		font-family: var(--font-mono);
		font-size: 11px;
		line-height: 1;
		white-space: nowrap;
		color: var(--ink);
		background: var(--paper);
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.25s var(--ease);
	}

	.scale:hover .label,
	.scale.is-dragging .label {
		opacity: 1;
	}

	@media (max-width: 767px), (hover: none) {
		.scale {
			display: none;
		}
	}
</style>
