<script lang="ts">
	import { drawModel, type GlyphId } from './model-glyphs';

	let { id, width, depth }: { id: GlyphId; width: number; depth: number } = $props();

	const shapes = $derived(drawModel(id, width, depth));
</script>

<g class="glyph" data-glyph={id}>
	{#each shapes as shape, index (index)}
		<svelte:element
			this={shape.tag}
			xmlns="http://www.w3.org/2000/svg"
			{...shape.attrs}
			class={shape.cls}
		/>
	{/each}
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

	.glyph :global(.solid) {
		fill: currentColor;
		fill-opacity: 0.82;
	}

	.glyph :global(.dot) {
		fill: currentColor;
		stroke: none;
		opacity: 0.55;
	}

	.glyph :global(.faint) {
		stroke-width: 0.75;
		opacity: 0.6;
	}
</style>
