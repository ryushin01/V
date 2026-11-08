<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, Dialog, Icon } from '#shared/ui';
	import {
		createEmptyPlan,
		createSamplePlan,
		deletePlan,
		listPlans,
		parsePlan,
		PlanPreview,
		savePlan,
		type PlanData
	} from '#entities/plan';
	import { ThemeToggle } from '#features/toggle-theme';
	import RulerFrame from './RulerFrame.svelte';

	const heroPlan = createSamplePlan();

	let plans = $state.raw<PlanData[]>([]);
	let status = $state<'loading' | 'ready' | 'failed'>('loading');
	let importError = $state('');
	let actionError = $state('');
	let pendingDelete = $state.raw<PlanData | null>(null);
	let deleteOpen = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let creating = false;

	async function refresh() {
		try {
			plans = await listPlans();
			status = 'ready';
		} catch {
			status = 'failed';
		}
	}

	onMount(refresh);

	async function openNewPlan(make: () => PlanData) {
		if (creating) return;
		creating = true;
		actionError = '';
		try {
			const plan = make();
			await savePlan(plan);
			await goto(resolve('/plans/[id]', { id: plan.id }));
		} catch {
			creating = false;
			actionError = '배치도를 저장하지 못했습니다. 비공개 창이라면 일반 창에서 열어 주세요.';
		}
	}

	async function importFile(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		importError = '';
		const parsed = parsePlan(await file.text());
		if (!parsed.ok) {
			importError = parsed.error;
			return;
		}
		await openNewPlan(() => parsed.plan);
	}

	function askDelete(plan: PlanData) {
		pendingDelete = plan;
		deleteOpen = true;
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		actionError = '';
		try {
			await deletePlan(pendingDelete.id);
			await refresh();
		} catch {
			actionError = '배치도를 삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요.';
		}
		deleteOpen = false;
		pendingDelete = null;
	}

	const formatDate = (time: number) =>
		new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(time);

	const CHECKS = [
		['겹침과 문', '회전한 물건끼리의 겹침, 문이 여닫히는 공간, 방 밖으로 나간 물건을 찾습니다.'],
		['동선', '문에서 좌석까지 폭 60cm로 걸어갈 수 있는지, 의자를 뒤로 뺄 수 있는지 확인합니다.'],
		['시청 거리', 'TV 크기에 맞는 권장 거리와 모니터까지의 거리를 재 줍니다.'],
		['전력과 구 수', '소비 전력, 멀티탭 구 수, 콘센트까지 닿는 케이블 길이를 계산합니다.'],
		['키보드만으로', '방향키로 1cm까지 옮기고 회전합니다. 결과는 음성으로도 안내합니다.']
	] as const;
</script>

<svelte:head>
	<title>V | 데스크·게이밍 셋업 배치도</title>
	<meta
		name="description"
		content="책상, 모니터, PC, 게임기, 의자, TV, 오디오, 콘센트를 실제 크기로 배치하고 동선과 전력을 점검합니다."
	/>
</svelte:head>

<a class="skip-link" href="#plans">내 배치도로 바로가기</a>
<RulerFrame />

<header class="top">
	<a class="mark" href={resolve('/')} aria-label="V 처음으로"
		>V<span class="tick" aria-hidden="true"></span></a
	>
	<ThemeToggle />
</header>

<main>
	<section class="hero">
		<div class="copy">
			<p class="measure" lang="en">DESK · GAMING SETUP PLANNER</p>
			<h1>자로 재고<br />놓으세요.</h1>
			<p class="lead">
				책상, 모니터, PC, 게임기, 의자, TV, 오디오, 콘센트를 실제 크기로 배치하고 동선과 전력까지
				점검합니다.
			</p>
			<div class="cta">
				<Button variant="primary" onclick={() => openNewPlan(createEmptyPlan)}>
					새 배치도 만들기 <Icon name="arrow" size={16} />
				</Button>
				<Button onclick={() => openNewPlan(createSamplePlan)}>예시로 시작하기</Button>
			</div>
		</div>
		<figure class="drawing">
			<PlanPreview
				plan={heroPlan}
				label="왼쪽 벽 쪽에 책상과 모니터, 오른쪽 벽 쪽에 TV장, 가운데에 소파를 놓은 방의 평면도"
			/>
			<figcaption class="measure">460 × 380 cm</figcaption>
		</figure>
	</section>

	<section class="checks" aria-labelledby="checks-heading">
		<h2 id="checks-heading">놓는 순간 점검합니다.</h2>
		<ul>
			{#each CHECKS as [title, body], index (title)}
				<li>
					<span class="measure">0{index + 1}</span>
					<h3>{title}</h3>
					<p>{body}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section id="plans" class="plans" aria-labelledby="plans-heading" tabindex="-1">
		<div class="plans-head">
			<h2 id="plans-heading">내 배치도</h2>
			<div>
				<input
					bind:this={fileInput}
					type="file"
					accept="application/json,.json"
					hidden
					onchange={importFile}
				/>
				<Button onclick={() => fileInput?.click()}
					><Icon name="upload" size={16} /> JSON 불러오기</Button
				>
			</div>
		</div>
		{#if importError}<p class="error" role="alert">{importError}</p>{/if}
		{#if actionError}<p class="error" role="alert">{actionError}</p>{/if}

		{#if status === 'failed'}
			<p class="error" role="alert">
				브라우저 저장소를 사용할 수 없습니다. 비공개 창이라면 일반 창에서 열어 주세요.
			</p>
		{:else if status === 'ready' && plans.length === 0}
			<p class="empty">
				아직 저장한 배치도가 없습니다. 이 브라우저에만 저장되며 서버로 보내지 않습니다.
			</p>
		{:else}
			<ul class="grid">
				{#each plans as plan (plan.id)}
					<li class="card">
						<a href={resolve('/plans/[id]', { id: plan.id })}>
							<span class="thumb">
								<PlanPreview {plan} />
							</span>
							<span class="title">{plan.name}</span>
							<span class="measure">
								{plan.room.width}×{plan.room.depth}cm · 물건 {plan.items.length}개 · {formatDate(
									plan.updatedAt
								)}
							</span>
						</a>
						<Button
							size="sm"
							variant="danger"
							aria-label={`${plan.name} 삭제`}
							onclick={() => askDelete(plan)}
						>
							<Icon name="trash" size={16} /> 삭제
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>

<Dialog bind:open={deleteOpen} title="배치도를 삭제할까요?">
	<p>‘{pendingDelete?.name}’을 삭제하면 되돌릴 수 없습니다.</p>
	{#snippet actions()}
		<Button onclick={() => (deleteOpen = false)}>취소</Button>
		<Button variant="danger" onclick={confirmDelete}>삭제</Button>
	{/snippet}
</Dialog>

<style>
	.top {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2.75rem var(--shell) 0;
	}

	.mark {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.25rem;
		min-height: 2.75rem;
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.1;
		color: inherit;
		text-decoration: none;
	}

	.tick {
		width: 3px;
		height: 0.625rem;
		margin-bottom: 0.375rem;
		background: var(--accent);
	}

	main {
		padding-inline: calc(var(--shell) + 1rem) var(--shell);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		align-items: end;
		gap: clamp(2rem, 4vw, 4rem);
		min-height: 100svh;
		padding-block: 7rem 4rem;
	}

	h1 {
		margin: 1rem 0 1.5rem;
		font-family: var(--font-display);
		font-size: clamp(3.5rem, 11vw, 10rem);
		font-weight: 800;
		line-height: 0.98;
		letter-spacing: -0.05em;
	}

	.lead {
		max-width: 34rem;
		font-size: clamp(1.0625rem, 1.4vw, 1.3125rem);
		color: var(--ink-2);
	}

	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		margin-top: 2rem;
	}

	.drawing {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		aspect-ratio: 46 / 41;
		grid-template-rows: minmax(0, 1fr) auto;
	}

	.checks {
		padding-block: 6rem;
	}

	h2 {
		font-family: var(--font-display);
		font-size: clamp(2.25rem, 5vw, 4.5rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.04em;
	}

	.checks ul {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}

	.checks li {
		padding-top: 1.25rem;
		border-top: 1px solid var(--line);
	}

	h3 {
		margin: 0.5rem 0;
		font-family: var(--font-display);
		font-size: 1.375rem;
		letter-spacing: -0.02em;
	}

	.checks p {
		color: var(--ink-2);
	}

	.plans {
		padding-block: 2rem 8rem;
		outline: none;
	}

	.plans-head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.empty {
		padding-top: 1.25rem;
		border-top: 1px solid var(--line);
		color: var(--ink-2);
	}

	.error {
		margin-bottom: 1rem;
		font-weight: 500;
		color: var(--accent-deep);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
		gap: 1.25rem;
	}

	.card {
		display: grid;
		justify-items: start;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-media);
		background: var(--paper-2);
	}

	.card a {
		display: grid;
		gap: 0.25rem;
		width: 100%;
		color: inherit;
		text-decoration: none;
	}

	.thumb {
		display: block;
		aspect-ratio: 4 / 3;
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		border-radius: var(--radius-field);
		background: var(--paper-2);
	}

	.title {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.card a:hover .title {
		color: var(--accent-deep);
	}

	@media (max-width: 767px) {
		main {
			padding-inline: var(--shell);
		}

		.top {
			padding-top: 0.75rem;
		}

		.hero {
			grid-template-columns: minmax(0, 1fr);
			min-height: auto;
			padding-top: 6rem;
		}
	}
</style>
