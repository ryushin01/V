<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Icon } from '#shared/ui';
	import {
		CATALOG,
		CATEGORY_LABELS,
		CustomProductLimitError,
		matchesCatalogQuery,
		listCustomProducts,
		parseCustomProductsFile,
		saveCustomProducts,
		stringifyCustomProducts,
		PLAN_LIMITS,
		type CatalogEntry,
		type CatalogCategory
	} from '#entities/plan';
	import type { EditorSession } from '../model/session.svelte';
	import CustomProductDialog from './CustomProductDialog.svelte';

	let { session }: { session: EditorSession } = $props();

	let query = $state('');
	let mine = $state.raw<CatalogEntry[]>([]);
	let dialogOpen = $state(false);
	let editing = $state.raw<CatalogEntry | null>(null);
	let fileInput = $state<HTMLInputElement>();
	let fileError = $state('');
	let fileNote = $state('');
	let importing = false;

	async function refresh() {
		try {
			mine = await listCustomProducts();
		} catch {
			mine = [];
		}
	}

	onMount(refresh);

	function openDialog(entry: CatalogEntry | null) {
		editing = entry;
		dialogOpen = true;
	}

	async function handleSaved(entry: CatalogEntry, place: boolean) {
		await refresh();
		if (place) session.addItem(entry.id);
		else session.announcement = `${entry.name} 정보를 저장했습니다.`;
	}

	async function handleDeleted() {
		await refresh();
		session.announcement = '내 제품에서 삭제했습니다.';
	}

	function exportMine() {
		fileError = '';
		const blob = new Blob([stringifyCustomProducts(mine)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'v-custom-products.json';
		link.click();
		// 다운로드가 비동기로 시작하는 브라우저를 위해 주소 해제를 미룹니다.
		setTimeout(() => URL.revokeObjectURL(url), 0);
		fileNote = `내 제품 ${mine.length}개를 파일로 내보냈습니다.`;
		session.announcement = fileNote;
	}

	async function importMine(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		input.value = '';
		if (!file || importing) return;
		importing = true;
		fileError = '';
		fileNote = '';
		try {
			const parsed = parseCustomProductsFile(await file.text());
			if (!parsed.ok) {
				fileError = parsed.error;
				return;
			}
			const known = new Set(mine.map((entry) => entry.id));
			const updated = parsed.entries.filter((entry) => known.has(entry.id)).length;
			await saveCustomProducts(parsed.entries);
			await refresh();
			const parts = [`새 제품 ${parsed.entries.length - updated}개`];
			if (updated > 0) parts.push(`바뀐 제품 ${updated}개`);
			if (parsed.skipped > 0) parts.push(`읽을 수 없어 건너뛴 항목 ${parsed.skipped}개`);
			fileNote = `내 제품을 가져왔습니다. ${parts.join(', ')}.`;
			session.announcement = fileNote;
		} catch (error) {
			fileError =
				error instanceof CustomProductLimitError
					? `${error.message} 가져오면 ${error.total}개가 되어 가져오지 않았습니다.`
					: '저장하지 못했습니다. 비공개 창이라면 일반 창에서 열어 주세요.';
		} finally {
			importing = false;
		}
	}

	const mineFiltered = $derived(mine.filter((entry) => matchesCatalogQuery(entry, query)));

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
	const count = $derived(
		groups.reduce((sum, group) => sum + group.entries.length, 0) + mineFiltered.length
	);
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
	<details open class="mine">
		<summary>내 제품 <span class="measure">{mine.length}</span></summary>
		<p class="hint">
			카탈로그에 없는 제품은 직접 등록해 치수와 전력을 마음대로 정할 수 있습니다. 파일로 내보내 다른
			기기에서 가져올 수 있고, 배치도 파일에 담긴 제품도 가져올 수 있습니다.
		</p>
		{#if mineFiltered.length > 0}
			<ul>
				{#each mineFiltered as entry (entry.id)}
					<li class="mine-row">
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
						<Button size="sm" aria-label={`${entry.name} 고치기`} onclick={() => openDialog(entry)}>
							고치기
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
		<div class="register">
			<Button size="sm" onclick={() => openDialog(null)}
				><Icon name="plus" size={16} /> 제품 등록</Button
			>
			{#if mine.length > 0}
				<Button size="sm" onclick={exportMine}
					><Icon name="download" size={16} /> 파일로 내보내기</Button
				>
			{/if}
			<input
				bind:this={fileInput}
				type="file"
				accept="application/json,.json"
				hidden
				onchange={importMine}
			/>
			<Button size="sm" onclick={() => fileInput?.click()}
				><Icon name="upload" size={16} /> 파일에서 가져오기</Button
			>
		</div>
		{#if fileError}<p class="file-error" role="alert">{fileError}</p>{/if}
		{#if fileNote}<p class="hint">{fileNote}</p>{/if}
	</details>
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
							<span class="measure"
								>{entry.width}×{entry.depth}{#if entry.dimsBasis === 'estimate'}<span
										class="estimate"
									>
										추정</span
									>{/if}</span
							>
							<Icon name="plus" size={16} />
							<span class="sr-only">배치도에 추가</span>
						</button>
					</li>
				{/each}
			</ul>
		</details>
	{/each}
</section>

<CustomProductDialog
	bind:open={dialogOpen}
	{editing}
	onsaved={handleSaved}
	ondeleted={handleDeleted}
/>

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

	.hint {
		margin-bottom: 0.5rem;
		font-size: 0.8125rem;
		color: var(--ink-2);
	}

	.mine-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.25rem;
	}

	.register {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		padding-bottom: 0.75rem;
	}

	.file-error {
		margin-bottom: 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--accent-deep);
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

	.estimate {
		margin-left: 0.25rem;
		color: var(--accent-deep);
	}

	.brand {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--ink-2);
	}
</style>
