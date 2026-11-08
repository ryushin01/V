<script lang="ts">
	import { openingGeometry } from '../model/room';
	import type { RoomData } from '../model/types';

	let { room }: { room: RoomData } = $props();

	const openings = $derived(
		room.openings.map((opening) => {
			const geometry = openingGeometry(room, opening);
			const { hinge, free, leafEnd } = geometry;
			const cross =
				(leafEnd.x - hinge.x) * (free.y - hinge.y) - (leafEnd.y - hinge.y) * (free.x - hinge.x);
			return {
				opening,
				geometry,
				arc: `M${leafEnd.x} ${leafEnd.y}A${opening.width} ${opening.width} 0 0 ${cross > 0 ? 1 : 0} ${free.x} ${free.y}`
			};
		})
	);
</script>

<g class="room">
	<rect class="floor" x="0" y="0" width={room.width} height={room.depth} />
	<rect class="wall" x="0" y="0" width={room.width} height={room.depth} />
	{#each openings as { opening, geometry, arc } (opening.id)}
		<line
			class="gap"
			x1={geometry.start.x}
			y1={geometry.start.y}
			x2={geometry.end.x}
			y2={geometry.end.y}
		/>
		{#if opening.kind === 'door'}
			<line
				class="leaf"
				x1={geometry.hinge.x}
				y1={geometry.hinge.y}
				x2={geometry.leafEnd.x}
				y2={geometry.leafEnd.y}
			/>
			<path class="swing" d={arc} />
		{:else}
			<line
				class="window"
				x1={geometry.start.x}
				y1={geometry.start.y}
				x2={geometry.end.x}
				y2={geometry.end.y}
			/>
		{/if}
	{/each}
</g>

<style>
	.room :global(*) {
		vector-effect: non-scaling-stroke;
	}

	.floor {
		fill: var(--paper);
	}

	.wall {
		fill: none;
		stroke: var(--ink);
		stroke-width: 3;
	}

	.gap {
		stroke: var(--paper);
		stroke-width: 5;
	}

	.leaf {
		stroke: var(--ink);
		stroke-width: 1.5;
	}

	.swing {
		fill: none;
		stroke: var(--steel);
		stroke-width: 1;
		stroke-dasharray: 2 4;
	}

	.window {
		stroke: var(--ink);
		stroke-width: 3;
		stroke-dasharray: 10 3;
	}
</style>
