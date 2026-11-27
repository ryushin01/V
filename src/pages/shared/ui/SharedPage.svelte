<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { protectStorage } from '#shared/lib/storage';
	import { BrandMark, Button, LiveMessage, PageMeta } from '#shared/ui';
	import { decodeShareHash, PlanPreview, savePlan, type PlanData } from '#entities/plan';
	import { ThemeToggle } from '#features/toggle-theme';

	let plan = $state.raw<PlanData | null>(null);
	let error = $state('');
	let saveError = $state('');
	let notice = $state('');
	let loading = $state(true);
	let saving = false;
	let main = $state<HTMLElement>();
	let heading = $state<HTMLHeadingElement>();
	/** 마지막으로 읽은 해시와 읽기 차례입니다. 해시가 빠르게 바뀌어도 마지막 해시의 결과만 씁니다. */
	let readHash: string | null = null;
	let readRun = 0;

	/**
	 * 배치도는 주소 해시에 있으므로, 다른 공유 링크를 붙여 넣거나 뒤로·앞으로 가서
	 * 해시만 바뀌어도(문서를 다시 읽지 않음) 그 해시를 다시 읽어 화면을 바꿉니다.
	 */
	async function load() {
		const hash = location.hash;
		if (hash === readHash) return;
		const first = readHash === null;
		readHash = hash;
		const run = ++readRun;
		loading = true;
		const result = await decodeShareHash(hash);
		if (run !== readRun) return;
		const hadFocus = !!main?.contains(document.activeElement);
		saveError = '';
		if (result.ok) {
			plan = result.plan;
			error = '';
			notice = first ? '' : `다른 공유 배치도를 열었습니다: ${result.plan.name}`;
		} else {
			plan = null;
			notice = '';
			error = result.error;
		}
		loading = false;
		// 화면이 바뀌며 초점이 있던 버튼이 사라지면 초점을 새 제목으로 옮겨 길을 잃지 않게 합니다.
		await tick();
		if (hadFocus && !main?.contains(document.activeElement)) heading?.focus();
	}

	onMount(() => {
		void load();
	});

	async function copyToMine() {
		if (!plan || saving) return;
		saving = true;
		saveError = '';
		void protectStorage();
		try {
			await savePlan({ ...plan, updatedAt: Date.now() });
			await goto(resolve('/plans/[id]', { id: plan.id }));
		} catch {
			saving = false;
			saveError = '이 브라우저에 저장하지 못했습니다. 비공개 창이라면 일반 창에서 열어 주세요.';
		}
	}
</script>

<svelte:window onhashchange={load} onpopstate={load} />

<PageMeta
	title={plan ? `${plan.name} | 공유된 배치도 | V` : '공유된 배치도 | V'}
	description="V에서 만든 데스크·게이밍 셋업 배치도를 받았습니다. 열어 보고 내 배치도로 복사할 수 있습니다."
	path="/shared"
	noindex
/>

<header class="top">
	<a class="mark" href={resolve('/')} aria-label="V 처음으로"><BrandMark /></a>
	<ThemeToggle />
</header>

<main class="page" aria-busy={loading} bind:this={main}>
	{#if plan}
		<p class="measure">공유된 배치도</p>
		<h1 class="display-2" tabindex="-1" bind:this={heading}>{plan.name}</h1>
		<p class="measure">{plan.room.width}×{plan.room.depth}cm · 물건 {plan.items.length}개</p>
		<div class="drawing">
			<PlanPreview {plan} label={`${plan.name}의 평면도, 물건 ${plan.items.length}개`} />
		</div>
		<Button variant="primary" arrow onclick={copyToMine}>내 배치도로 복사</Button>
		<LiveMessage message={saveError} />
	{:else}
		<h1 class="display-2" tabindex="-1" bind:this={heading}>
			{error ? '배치도를 열 수 없습니다' : '배치도를 여는 중입니다'}
		</h1>
	{/if}
	<!-- 링크를 읽은 결과는 처음부터 둔 영역에 넣어야 화면 낭독기가 읽습니다. -->
	<LiveMessage message={error} />
	<LiveMessage message={notice} role="status" srOnly />
	{#if error}<Button href={resolve('/')}>처음으로</Button>{/if}
</main>

<style>
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem var(--shell);
	}

	.mark {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.1875rem;
		min-height: 2.75rem;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 500;
		line-height: 1.6;
		color: inherit;
		text-decoration: none;
	}

	.page {
		display: grid;
		justify-items: start;
		gap: 1rem;
		max-width: 56rem;
		padding: 2rem var(--shell) 5rem;
	}

	.drawing {
		width: min(100%, 44rem);
		aspect-ratio: 5 / 4;
	}
</style>
