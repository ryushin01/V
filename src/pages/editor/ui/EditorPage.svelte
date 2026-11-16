<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button } from '#shared/ui';
	import {
		getPlan,
		listCustomProducts,
		onPlanChange,
		savePlan,
		type PlanData
	} from '#entities/plan';
	import { EditorSession } from '../model/session.svelte';
	import CatalogPanel from './CatalogPanel.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import FloorPlan from './FloorPlan.svelte';
	import ItemForm from './ItemForm.svelte';
	import ItemList from './ItemList.svelte';
	import ReviewPanel from './ReviewPanel.svelte';
	import RoomForm from './RoomForm.svelte';
	import UnderlayForm from './UnderlayForm.svelte';

	let { id }: { id: string } = $props();

	let session = $state.raw<EditorSession | null>(null);
	let loadState = $state<'loading' | 'ready' | 'missing' | 'deleted' | 'failed'>('loading');
	let saveStatus = $state<'saved' | 'saving' | 'error'>('saved');
	/** 이 탭이 마지막으로 불러오거나 저장한 내용의 저장 시각. 다른 탭이 더 늦게 저장했는지 비교합니다. */
	let knownUpdatedAt = 0;

	$effect(() => {
		const planId = id;
		let active = true;
		loadState = 'loading';
		getPlan(planId)
			.then((plan) => {
				if (!active) return;
				session = plan ? new EditorSession(plan) : null;
				knownUpdatedAt = plan?.updatedAt ?? 0;
				loadState = plan ? 'ready' : 'missing';
			})
			.catch(() => {
				if (active) loadState = 'failed';
			});
		return () => {
			active = false;
		};
	});

	const SAVE_DELAY_MS = 300;
	/** 아직 저장소에 넘기지 않은 변경 */
	let pending: PlanData | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	/** 저장 중인 요청 수 */
	let inFlight = 0;
	/** 자동 저장에 마지막으로 넘긴 내용과, 저장소가 저장을 확인한 내용(저장 시각 제외) */
	let scheduled = '';
	let confirmed = '';
	/** 이 탭 사정(저장하지 않은 변경, 끌기)으로 다른 탭의 변경을 미뤄 두었는지 */
	let syncWanted = false;

	const fingerprint = (plan: PlanData) => JSON.stringify({ ...plan, updatedAt: 0 });

	function persist(plan: PlanData) {
		pending = null;
		inFlight += 1;
		// 다른 탭과 저장 순서를 비교하도록, 변경을 캡처한 때가 아니라 저장소에 쓰는 때의 시각을 붙입니다.
		const stamped = { ...plan, updatedAt: Date.now() };
		savePlan(stamped)
			.then(
				() => {
					knownUpdatedAt = Math.max(knownUpdatedAt, stamped.updatedAt);
					confirmed = fingerprint(stamped);
					saveStatus = pending ? 'saving' : 'saved';
				},
				// 실패한 변경은 confirmed와 달라 저장하지 않은 변경으로 남습니다(다른 탭 내용이 덮지 않음).
				() => (saveStatus = 'error')
			)
			.finally(() => {
				inFlight -= 1;
				if (syncWanted) void syncFromStorage();
			});
	}

	function flush() {
		clearTimeout(timer);
		if (pending) persist(pending);
	}

	// 바뀐 내용이 있을 때만 타이머를 다시 겁니다. 내용이 같은데 효과가 다시 돌 때(내 제품 목록을 다시 읽는 등)
	// 타이머를 지우면 저장이 멈추므로, 정리 함수로 타이머를 지우지 않고 화면을 떠날 때 flush합니다.
	$effect(() => {
		if (!session) return;
		const plan = session.toData();
		const current = fingerprint(plan);
		if (!scheduled) {
			scheduled = current;
			confirmed = current;
			return;
		}
		if (scheduled === current) return;
		scheduled = current;
		pending = plan;
		untrack(() => (saveStatus = 'saving'));
		clearTimeout(timer);
		timer = setTimeout(flush, SAVE_DELAY_MS);
	});

	onDestroy(flush);

	/**
	 * 이 탭에 저장하지 않았거나(실패 포함) 저장 중인 변경, 끌고 있는 물건이 있으면 다른 탭 내용을
	 * 덮어 불러오지 않습니다.
	 */
	const busy = () =>
		!session || pending !== null || inFlight > 0 || scheduled !== confirmed || session.hasGesture;

	/**
	 * 다른 탭에서 저장하거나 지운 내용을 불러옵니다. 이 탭이 바쁘면 미뤄 두었다가 저장이나 끌기가 끝나면
	 * 다시 봅니다. 그사이 이 탭이 저장하면 그 내용이 최신이 됩니다(나중에 저장한 쪽이 남음).
	 */
	async function syncFromStorage() {
		if (busy()) {
			syncWanted = true;
			return;
		}
		syncWanted = false;
		let latest: PlanData | undefined;
		try {
			latest = await getPlan(id);
			// 배치도에 담긴 사본은 없는 내 제품만 채우므로, 다른 탭에서 고친 내 제품 정의를 저장소에서 다시 읽습니다.
			await listCustomProducts();
		} catch {
			return;
		}
		if (busy() || !session) {
			syncWanted = true;
			return;
		}
		if (!latest) {
			session = null;
			loadState = 'deleted';
			return;
		}
		if (latest.updatedAt <= knownUpdatedAt) return;
		knownUpdatedAt = latest.updatedAt;
		session.replaceWith(latest);
		// 불러온 내용을 다시 저장하지 않도록 자동 저장의 비교 기준을 맞춥니다.
		scheduled = confirmed = fingerprint(session.toData());
	}

	$effect(() =>
		onPlanChange((change) => {
			// 내 제품 변경은 물건 목록(CatalogPanel)이 다시 읽습니다.
			if (change.type === 'products' || change.id !== id) return;
			if (change.type === 'saved' && change.updatedAt <= knownUpdatedAt) return;
			void syncFromStorage();
		})
	);

	// 끌기 중에 받은 변경은 끌기가 끝나면(옮기지 않고 놓은 경우 포함) 불러옵니다.
	$effect(() => {
		if (session && !session.hasGesture && syncWanted) void syncFromStorage();
	});

	function handleVisibility() {
		// 휴대폰에서 앱을 바꾸면 pagehide 없이 정리될 수 있어, 숨겨질 때 바로 저장합니다.
		if (document.visibilityState === 'hidden') flush();
		else void syncFromStorage();
	}

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

	const pageTitle = $derived(session ? `${session.savedName} 편집 | V` : '배치도 편집 | V');

	const MESSAGES = {
		missing: ['배치도를 찾을 수 없습니다', '이 브라우저에 저장된 배치도만 열 수 있습니다.'],
		deleted: ['배치도가 삭제되었습니다', '다른 탭에서 이 배치도를 삭제했습니다.'],
		failed: [
			'배치도를 불러오지 못했습니다',
			'브라우저 저장소를 사용할 수 없는 상태입니다. 비공개 창이라면 일반 창에서 열어 주세요.'
		]
	} as const;
	const message = $derived(
		MESSAGES[loadState === 'deleted' || loadState === 'failed' ? loadState : 'missing']
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<svelte:window
	onkeydown={handleKeydown}
	onpagehide={flush}
	onpageshow={(event) => {
		if (event.persisted) void syncFromStorage();
	}}
/>
<svelte:document onvisibilitychange={handleVisibility} />

{#if session && loadState === 'ready'}
	<div class="editor">
		<a class="skip-link" href="#stage">배치도로 바로가기</a>
		<EditorToolbar {session} {saveStatus} />
		<main class="workspace">
			<h1 class="sr-only">{session.savedName} 편집</h1>
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
					<UnderlayForm {session} />
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
		<h1>{message[0]}</h1>
		<p>{message[1]}</p>
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
