<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { protectStorage } from '#shared/lib/storage';
	import { BrandMark, Button, LiveMessage, PageMeta } from '#shared/ui';
	import { decodePlan, PlanPreview, savePlan, type PlanData } from '#entities/plan';
	import { ThemeToggle } from '#features/toggle-theme';

	let plan = $state.raw<PlanData | null>(null);
	let error = $state('');
	let saveError = $state('');
	let loading = $state(true);
	let saving = false;

	onMount(async () => {
		const result = await decodePlan(location.hash.slice(1));
		if (result.ok) plan = result.plan;
		else error = result.error;
		loading = false;
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

<main class="page" aria-busy={loading}>
	{#if plan}
		<p class="measure">공유된 배치도</p>
		<h1 class="display-2">{plan.name}</h1>
		<p class="measure">{plan.room.width}×{plan.room.depth}cm · 물건 {plan.items.length}개</p>
		<div class="drawing">
			<PlanPreview {plan} label={`${plan.name}의 평면도, 물건 ${plan.items.length}개`} />
		</div>
		<Button variant="primary" arrow onclick={copyToMine}>내 배치도로 복사</Button>
		<LiveMessage message={saveError} />
	{:else}
		<h1 class="display-2">{error ? '배치도를 열 수 없습니다' : '배치도를 여는 중입니다'}</h1>
	{/if}
	<!-- 링크를 읽은 결과는 처음부터 둔 영역에 넣어야 화면 낭독기가 읽습니다. -->
	<LiveMessage message={error} />
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
