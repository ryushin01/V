<script lang="ts">
	import { Icon } from '#shared/ui';
	import {
		CATALOG,
		CATEGORY_LABELS,
		matchesCatalogQuery,
		PLAN_LIMITS,
		type CatalogCategory
	} from '#entities/plan';
	import type { EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();

	let query = $state('');

	const groups = $derived(
		(Object.keys(CATEGORY_LABELS) as CatalogCategory[])
			.map((category) => ({
				category,
				label: CATEGORY_LABELS[category],
				entries: CATALOG.filter(
					(entry) => entry.category === category && matchesCatalogQuery(entry, query)
				)
			}))
			.filter((group) => group.entries.length > 0)
	);
	const count = $derived(groups.reduce((sum, group) => sum + group.entries.length, 0));
</script>

<section class="panel" aria-labelledby="catalog-heading">
	<h2 id="catalog-heading" tabindex="-1">물건 추가</h2>
	{#if !session.canAddItem}
		<p class="limit">물건은 {PLAN_LIMITS.items}개까지 놓을 수 있습니다.</p>
	{/if}
	<div class="search">
		<label for="catalog-search">모델명이나 제조사로 찾기</label>
		<input
			id="catalog-search"
			type="search"
			autocomplete="off"
			placeholder="예: G9, PS5, LG"
			bind:value={query}
			aria-describedby="catalog-count"
		/>
		<p id="catalog-count" class="measure" aria-live="polite">{count}개</p>
	</div>
	{#if count === 0}
		<p class="empty">
			찾는 물건이 없습니다. 비슷한 크기의 기본 물건을 놓고 규격을 직접 입력해 주세요.
		</p>
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
							<span class="name">
								{#if entry.brand}<span class="brand">{entry.brand}</span>{/if}
								{entry.name}
							</span>
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

	.limit,
	.empty {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.limit {
		color: var(--accent-deep);
	}

	.empty {
		color: var(--ink-2);
	}

	.search {
		display: grid;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.search label {
		font-size: 0.8125rem;
		color: var(--ink-2);
	}

	.search input {
		min-height: 2.5rem;
		padding: 0 0.625rem;
		border: 1px solid var(--control);
		border-radius: var(--radius-field);
		font-size: 0.875rem;
		color: var(--ink);
		background: var(--paper);
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
		padding: 0.375rem 0.5rem;
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

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.name {
		display: grid;
		line-height: 1.3;
	}

	.brand {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--ink-2);
	}
</style>
