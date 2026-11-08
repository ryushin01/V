<script lang="ts">
	import type { CatalogEntry } from '../model/types';

	let { entry }: { entry: CatalogEntry } = $props();

	const w = $derived(entry.width);
	const d = $derived(entry.depth);
	const left = $derived(-w / 2);
	const top = $derived(-d / 2);
	const portXs = $derived(
		Array.from(
			{ length: entry.ports ?? 0 },
			(_, index) => left + (w * (index + 1)) / ((entry.ports ?? 0) + 1)
		)
	);
</script>

<g class="glyph">
	<!-- 회전 0도에서 의자는 위쪽을, 화면은 아래쪽을 바라봅니다. -->
	{#if entry.kind === 'chair'}
		<rect
			class="body"
			x={left + w * 0.09}
			y={top + d * 0.08}
			width={w * 0.82}
			height={d * 0.68}
			rx="10"
		/>
		<path
			d={`M${left + w * 0.12} ${top + d * 0.9}Q0 ${top + d * 1.04} ${left + w * 0.88} ${top + d * 0.9}`}
		/>
		<path d={`M${-w * 0.14} ${top + d * 0.08}L0 ${top}L${w * 0.14} ${top + d * 0.08}`} />
	{:else if entry.kind === 'sofa'}
		<rect class="body" x={left} y={top} width={w} height={d} rx="8" />
		<path
			d={`M${left + 12} ${top}V${-top - 22}H${-left - 12}V${top}M0 ${top}V${-top - 22}M${left} ${-top - 22}H${-left}`}
		/>
	{:else if entry.kind === 'monitor' || entry.kind === 'tv'}
		<rect
			class="body"
			x={left}
			y={-top - Math.min(6, d * 0.3)}
			width={w}
			height={Math.min(6, d * 0.3)}
			rx="1"
		/>
		<rect x={-w * 0.18} y={top} width={w * 0.36} height={d * 0.55} rx="2" />
		<path d={`M${-w * 0.03} ${d / 2 + 2}L0 ${d / 2 + 6}L${w * 0.03} ${d / 2 + 2}`} />
	{:else}
		<rect
			class="body"
			x={left}
			y={top}
			width={w}
			height={d}
			rx={entry.kind === 'desk' ? 1.5 : 2.5}
		/>
		{#if entry.kind === 'desk'}
			<path d={`M${left + 5} ${top + 5}H${-left - 5}V${-top - 5}H${left + 5}Z`} />
		{:else if entry.kind === 'stand'}
			<path d={`M${-w / 6} ${top}V${-top}M${w / 6} ${top}V${-top}`} />
		{:else if entry.kind === 'pc'}
			<circle cx="0" cy={top + d * 0.3} r={w * 0.3} />
			<path
				d={`M${left + 3} ${top + d * 0.68}H${-left - 3}M${left + 3} ${top + d * 0.8}H${-left - 3}`}
			/>
		{:else if entry.kind === 'console'}
			<path d={`M${left + w * 0.2} ${top}V${-top}M${left + w * 0.2} 0H${-left - 4}`} />
		{:else if entry.kind === 'speaker'}
			<circle cx="0" cy={d * 0.08} r={w * 0.32} />
			<circle cx="0" cy={top + d * 0.18} r={w * 0.1} />
		{:else if entry.kind === 'subwoofer'}
			<circle cx="0" cy="0" r={w * 0.38} />
			<circle cx="0" cy="0" r={w * 0.14} />
		{:else if entry.kind === 'soundbar'}
			{#each [-0.32, 0, 0.32] as ratio (ratio)}
				<circle cx={w * ratio} cy="0" r={d * 0.22} />
			{/each}
		{:else if entry.kind === 'receiver'}
			<circle cx={w * 0.26} cy="0" r={d * 0.24} />
			<path d={`M${left + 5} ${-d * 0.14}H${-w * 0.02}M${left + 5} ${d * 0.14}H${-w * 0.02}`} />
		{:else if entry.kind === 'outlet' || entry.kind === 'strip'}
			{#each portXs as x (x)}
				<circle cx={x} cy="0" r={Math.min(d * 0.3, 2.2)} />
			{/each}
		{/if}
	{/if}
</g>

<style>
	.glyph :global(*) {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.25;
		vector-effect: non-scaling-stroke;
	}

	.glyph :global(.body) {
		fill: var(--item-fill, var(--paper));
	}
</style>
