<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button } from '#shared/ui';
	import { getPlan, savePlan, type PlanData } from '#entities/plan';
	import { EditorSession } from '../model/session.svelte';
	import CatalogPanel from './CatalogPanel.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import FloorPlan from './FloorPlan.svelte';
	import ItemForm from './ItemForm.svelte';
	import ItemList from './ItemList.svelte';
	import ReviewPanel from './ReviewPanel.svelte';
	import RoomForm from './RoomForm.svelte';

	let { id }: { id: string } = $props();

	let session = $state.raw<EditorSession | null>(null);
	let loadState = $state<'loading' | 'ready' | 'missing' | 'failed'>('loading');
	let saveStatus = $state<'saved' | 'saving' | 'error'>('saved');

	$effect(() => {
		const planId = id;
		let active = true;
		loadState = 'loading';
		getPlan(planId).then(
			(plan) => {
				if (!active) return;
				session = plan ? new EditorSession(plan) : null;
				loadState = plan ? 'ready' : 'missing';
			},
			() => {
				if (active) loadState = 'failed';
			}
		);
		return () => {
			active = false;
		};
	});

	const SAVE_DELAY_MS = 300;
	let pending: PlanData | null = null;
	let lastSaved = '';

	function persist(plan: PlanData) {
		pending = null;
		savePlan(plan).then(
			() => (saveStatus = pending ? 'saving' : 'saved'),
			() => (saveStatus = 'error')
		);
	}

	$effect(() => {
		if (!session) return;
		const plan = session.toData();
		const fingerprint = JSON.stringify({ ...plan, updatedAt: 0 });
		if (!lastSaved || lastSaved === fingerprint) {
			lastSaved = fingerprint;
			return;
		}
		lastSaved = fingerprint;
		pending = plan;
		untrack(() => (saveStatus = 'saving'));
		const timer = setTimeout(() => persist(plan), SAVE_DELAY_MS);
		return () => clearTimeout(timer);
	});

	function flush() {
		if (pending) persist(pending);
	}

	onDestroy(flush);

	function handleKeydown(event: KeyboardEvent) {
		if (!session || !(event.ctrlKey || event.metaKey)) return;
		const target = event.target as HTMLElement | null;
		if (target?.matches('input, textarea, select')) return;
		const key = event.key.toLowerCase();
		if (key === 'z' && !event.shiftKey) {
			event.preventDefault();
			session.undo();
		} else if ((key === 'z' && event.shiftKey) || key === 'y') {
			event.preventDefault();
			session.redo();
		}
	}

	const pageTitle = $derived(session ? `${session.name} 편집 | V` : '배치도 편집 | V');
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} onpagehide={flush} />

{#if session && loadState === 'ready'}
	<div class="editor">
		<a class="skip-link" href="#stage">배치도로 바로가기</a>
		<EditorToolbar {session} {saveStatus} />
		<main class="workspace">
			<h1 class="sr-only">{session.name} 편집</h1>
			<aside class="side" aria-label="물건 목록"><CatalogPanel {session} /></aside>
			<section id="stage" class="center" aria-label="배치도" tabindex="-1">
				<FloorPlan {session} />
			</section>
			<aside class="side right" aria-label="속성과 점검">
				{#if session.selected}
					{#key session.selected.id}
						<ItemForm {session} item={session.selected} />
					{/key}
				{:else}
					<RoomForm {session} />
				{/if}
				<ReviewPanel {session} />
				<ItemList {session} />
			</aside>
		</main>
		<p class="sr-only" role="status" aria-live="polite">{session.announcement}</p>
	</div>
{:else if loadState === 'loading'}
	<main class="message" aria-busy="true"><h1>배치도를 불러오는 중입니다</h1></main>
{:else}
	<main class="message">
		<h1>
			{loadState === 'missing' ? '배치도를 찾을 수 없습니다' : '배치도를 불러오지 못했습니다'}
		</h1>
		<p>
			{loadState === 'missing'
				? '이 브라우저에 저장된 배치도만 열 수 있습니다.'
				: '브라우저 저장소를 사용할 수 없는 상태입니다. 비공개 창이라면 일반 창에서 열어 주세요.'}
		</p>
		<Button variant="primary" href={resolve('/')}>배치도 목록으로</Button>
	</main>
{/if}

<style>
	.editor {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		height: 100dvh;
	}

	.workspace {
		display: grid;
		grid-template-columns: 16rem minmax(0, 1fr) 21rem;
		min-height: 0;
	}

	.side {
		min-width: 0;
		overflow-y: auto;
	}

	.side:first-of-type {
		border-right: 1px solid var(--line);
	}

	.side.right {
		border-left: 1px solid var(--line);
	}

	.center {
		min-width: 0;
		min-height: 0;
		outline: none;
	}

	.message {
		display: grid;
		align-content: center;
		justify-items: start;
		gap: 1rem;
		min-height: 100dvh;
		padding: var(--shell);
	}

	.message h1 {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3.5rem);
		letter-spacing: -0.03em;
		line-height: 1.1;
	}

	@media (max-width: 1100px) {
		.editor {
			display: block;
			height: auto;
		}

		.workspace {
			display: flex;
			flex-direction: column;
		}

		.side {
			overflow: visible;
		}

		.side:first-of-type {
			max-height: 34svh;
			overflow-y: auto;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}

		.side.right {
			border-left: 0;
			border-top: 1px solid var(--line);
		}

		.center {
			height: 68svh;
			min-height: 22rem;
		}
	}
</style>
