<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '#shared/ui';
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
		try {
			await savePlan({ ...plan, updatedAt: Date.now() });
			await goto(resolve('/plans/[id]', { id: plan.id }));
		} catch {
			saving = false;
			saveError = '이 브라우저에 저장하지 못했습니다. 비공개 창이라면 일반 창에서 열어 주세요.';
		}
	}
</script>

<svelte:head>
	<title>{plan ? `${plan.name} | 공유된 배치도 | V` : '공유된 배치도 | V'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<header class="top">
	<a class="mark" href={resolve('/')} aria-label="V 처음으로"
		>V<span class="tick" aria-hidden="true"></span></a
	>
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
		{#if saveError}<p class="error" role="alert">{saveError}</p>{/if}
	{:else if error}
		<h1 class="display-2">배치도를 열 수 없습니다</h1>
		<p class="error" role="alert">{error}</p>
		<Button href={resolve('/')}>처음으로</Button>
	{:else}
		<h1 class="display-2">배치도를 여는 중입니다</h1>
	{/if}
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
		font-weight: 700;
		line-height: 1.6;
		color: inherit;
		text-decoration: none;
	}

	.tick {
		width: 2px;
		height: 0.5rem;
		margin-bottom: 0.5rem;
		background: var(--accent);
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

	.error {
		font-weight: 500;
		color: var(--accent-deep);
	}
</style>
