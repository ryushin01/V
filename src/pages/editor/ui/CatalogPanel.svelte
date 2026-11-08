<script lang="ts">
	import { Icon } from '#shared/ui';
	import { CATALOG, CATEGORY_LABELS, PLAN_LIMITS, type CatalogCategory } from '#entities/plan';
	import type { EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const groups = (Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map((category) => ({
		category,
		label: CATEGORY_LABELS[category],
		entries: CATALOG.filter((entry) => entry.category === category)
	}));
</script>

<section class="panel" aria-labelledby="catalog-heading">
	<h2 id="catalog-heading" tabindex="-1">물건 추가</h2>
	{#if !session.canAddItem}
		<p class="limit">물건은 {PLAN_LIMITS.items}개까지 놓을 수 있습니다.</p>
	{/if}
	{#each groups as group (group.category)}
		<details open>
			<summary>{group.label}</summary>
			<ul>
				{#each group.entries as entry (entry.id)}
					<li>
						<button
							type="button"
							disabled={!session.canAddItem}
							onclick={() => session.addItem(entry.id)}
						>
							<span class="name">{entry.name}</span>
							<span class="measure">{entry.width}×{entry.depth}</span>
							<Icon name="plus" size={16} />
							<span class="sr-only">배치도에 추가</span>
						</button>
					</li>
				{/each}
			</ul>
		</details>
	{/each}
</section>

<style>
	.panel {
		padding: 1rem;
	}

	h2 {
		margin-bottom: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.125rem;
		letter-spacing: -0.02em;
		outline: none;
	}

	.limit {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: var(--accent-deep);
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	details {
		border-top: 1px solid var(--line);
	}

	summary {
		padding: 0.625rem 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--ink-2);
		cursor: pointer;
	}

	ul {
		padding-bottom: 0.5rem;
	}

	button {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		min-height: 2.5rem;
		padding: 0 0.5rem;
		border: 0;
		border-radius: var(--radius-field);
		font-size: 0.875rem;
		text-align: left;
		color: var(--ink);
		background: transparent;
		cursor: pointer;
	}

	button:hover {
		background: var(--paper-2);
	}
</style>
