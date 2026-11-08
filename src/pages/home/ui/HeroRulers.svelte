<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { Ruler } from '#shared/ui';

	/** 큰 눈금 64px, 잔눈금 8px 고정입니다. */
	const STEP = { majorCm: 64, minorCm: 8 };

	let width = $state(0);
	let height = $state(0);
	let pointer = $state<{ x: number; y: number } | null>(null);

	const track: Attachment<HTMLElement> = (node) => {
		const parent = node.parentElement;
		if (!parent) return;
		const move = (event: PointerEvent) => {
			const rect = parent.getBoundingClientRect();
			pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
		};
		const leave = () => (pointer = null);
		parent.addEventListener('pointermove', move);
		parent.addEventListener('pointerleave', leave);
		return () => {
			parent.removeEventListener('pointermove', move);
			parent.removeEventListener('pointerleave', leave);
		};
	};
</script>

<div
	class="rulers"
	bind:clientWidth={width}
	bind:clientHeight={height}
	{@attach track}
	aria-hidden="true"
>
	<div class="x">
		<Ruler
			axis="x"
			bare
			fixedStep={STEP}
			length={width}
			scale={1}
			offset={0}
			pointer={pointer?.x ?? null}
		/>
	</div>
	<div class="y">
		<Ruler
			axis="y"
			bare
			fixedStep={STEP}
			length={height}
			scale={1}
			offset={0}
			pointer={pointer?.y ?? null}
		/>
	</div>
</div>

<style>
	.rulers {
		--ruler-x: 32px;
		--ruler-y: 32px;
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}

	.x {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
	}

	.y {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		display: grid;
	}

	@media (max-width: 767px) {
		.rulers {
			display: none;
		}
	}
</style>
