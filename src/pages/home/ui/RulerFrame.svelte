<script lang="ts">
	import { innerHeight, innerWidth, scrollY } from 'svelte/reactivity/window';
	import { Ruler } from '#shared/ui';

	let pointer = $state<{ x: number; y: number } | null>(null);

	const width = $derived(innerWidth.current ?? 0);
	const height = $derived(innerHeight.current ?? 0);
	const scroll = $derived(scrollY.current ?? 0);
	const pageY = $derived(pointer ? pointer.y + scroll : null);
</script>

<svelte:window onpointermove={(event) => (pointer = { x: event.clientX, y: event.clientY })} />

<div class="frame-x">
	<Ruler axis="x" length={width} scale={1} offset={0} pointer={pointer?.x ?? null} />
</div>
<div class="frame-y">
	<Ruler axis="y" length={height} scale={1} offset={-scroll} pointer={pageY} />
</div>

<style>
	.frame-x,
	.frame-y {
		position: fixed;
		z-index: 40;
		pointer-events: none;
	}

	.frame-x {
		top: 0;
		right: 0;
		left: 0;
	}

	.frame-y {
		top: 0;
		bottom: 0;
		left: 0;
		display: grid;
	}

	@media (max-width: 767px) {
		.frame-x,
		.frame-y {
			display: none;
		}
	}
</style>
