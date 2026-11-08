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
	import { xray } from '#features/toggle-xray';
	import { reveal } from '#shared/lib/reveal';
	import { ScrollTracker } from '../model/scroll.svelte';
	import BuildStage from './BuildStage.svelte';
	import HeroRulers from './HeroRulers.svelte';
	import PageScale from './PageScale.svelte';
	import SiteNav from './SiteNav.svelte';

	const heroPlan = createSamplePlan();
	const tracker = new ScrollTracker();

	onMount(() => tracker.start());

	let drawingWidth = $state(0);
	let measure = $state<{ x: number; y: number } | null>(null);
	const drawingScale = $derived(drawingWidth > 0 ? drawingWidth / (heroPlan.room.width + 16) : 1);

	function trackMeasure(event: PointerEvent & { currentTarget: HTMLElement }) {
		const rect = event.currentTarget.getBoundingClientRect();
		measure = { x: event.clientX - rect.left, y: event.clientY - rect.top };
	}

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
<SiteNav {tracker} />
<PageScale {tracker} />

<main>
	<section class="hero" data-section="소개">
		<HeroRulers />
		<figure
			class="drawing"
			bind:clientWidth={drawingWidth}
			onpointermove={trackMeasure}
			onpointerleave={() => (measure = null)}
		>
			<PlanPreview
				plan={heroPlan}
				xray={xray.on}
				label="왼쪽 벽 쪽에 책상과 모니터, 오른쪽 벽 쪽에 TV장, 가운데에 소파를 놓은 방의 평면도"
			/>
			{#if measure}
				<span class="line h" style:top={`${measure.y}px`} aria-hidden="true"></span>
				<span class="line v" style:left={`${measure.x}px`} aria-hidden="true"></span>
				<span
					class="coords measure"
					style:top={`${measure.y + 10}px`}
					style:left={`${measure.x + 10}px`}
					aria-hidden="true"
				>
					X {Math.round(measure.x / drawingScale - 8)} · Y {Math.round(
						measure.y / drawingScale - 8
					)} cm
				</span>
			{/if}
			<figcaption class="measure">460 × 380 cm</figcaption>
		</figure>
		<div class="title">
			<p class="measure" lang="en">DESK · GAMING SETUP PLANNER</p>
			<h1 class="display-1">자로 재고<br />놓으세요.</h1>
			<p class="hint">
				<span class="dot" aria-hidden="true"></span>
				<span><b lang="en">X-ray</b>를 켜면 도면 아래의 치수와 케이블이 드러납니다.</span>
			</p>
		</div>
		<div class="lead">
			<p>
				책상, 모니터, PC, 게임기, 의자, TV, 오디오, 콘센트를 실제 크기로 배치하고 동선과 전력까지
				점검합니다.
			</p>
			<div class="cta">
				<Button variant="primary" arrow onclick={() => openNewPlan(createEmptyPlan)}>
					새 배치도 만들기
				</Button>
				<Button onclick={() => openNewPlan(createSamplePlan)}>예시로 시작하기</Button>
			</div>
		</div>
	</section>

	<BuildStage {tracker} plan={heroPlan} />

	<section id="checks" class="checks" aria-labelledby="checks-heading" data-section="점검">
		<h2 id="checks-heading" class="display-2" {@attach reveal}>놓는 순간 점검합니다.</h2>
		<ul>
			{#each CHECKS as [title, body], index (title)}
				<li {@attach reveal} style:--i={index}>
					<h3 class="display-4">{title}</h3>
					<p>{body}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section
		id="plans"
		class="plans"
		aria-labelledby="plans-heading"
		tabindex="-1"
		data-section="내 배치도"
	>
		<div class="plans-head">
			<h2 id="plans-heading" class="display-2">내 배치도</h2>
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
							<span class="title-text">{plan.name}</span>
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

	<section class="closing" aria-labelledby="closing-heading" data-section="시작">
		<h2 id="closing-heading" class="display-1" {@attach reveal}>옮기기 전에,<br />재 보세요.</h2>
		<Button variant="primary" arrow onclick={() => openNewPlan(createEmptyPlan)}
			>빈 방에서 시작하기</Button
		>
	</section>
</main>

<footer class="foot measure">
	<span>배치도는 이 브라우저에만 저장되며 서버로 보내지 않습니다.</span>
	<a href="https://github.com/ryushin01/V" rel="noreferrer">GitHub</a>
</footer>

<Dialog bind:open={deleteOpen} title="배치도를 삭제할까요?">
	<p>‘{pendingDelete?.name}’을 삭제하면 되돌릴 수 없습니다.</p>
	{#snippet actions()}
		<Button onclick={() => (deleteOpen = false)}>취소</Button>
		<Button variant="danger" onclick={confirmDelete}>삭제</Button>
	{/snippet}
</Dialog>

<style>
	main {
		padding-inline: calc(var(--shell) + 1rem) var(--shell);
	}

	.hero {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 1.5rem clamp(2rem, 4vw, 4rem);
		min-height: 100svh;
		margin-inline: calc((var(--shell) + 1rem) * -1) calc(var(--shell) * -1);
		padding: calc(var(--nav-h) + 3.5rem) var(--shell) 3rem calc(var(--shell) + 1rem);
	}

	.drawing {
		position: relative;
		grid-column: 2;
		grid-row: 1;
		align-self: end;
		justify-self: end;
		z-index: 2;
		display: grid;
		gap: 0.5rem;
		width: min(100%, 62svh);
		margin: 0;
		aspect-ratio: 46 / 41;
		grid-template-rows: minmax(0, 1fr) auto;
	}

	.line {
		position: absolute;
		background: var(--accent);
		opacity: 0.7;
		pointer-events: none;
	}

	.line.h {
		right: 0;
		left: 0;
		height: 1px;
	}

	.line.v {
		top: 0;
		bottom: 0;
		width: 1px;
	}

	.coords {
		position: absolute;
		padding: 3px 6px;
		border: 1px solid var(--line);
		border-radius: 4px;
		white-space: nowrap;
		color: var(--ink);
		background: var(--paper);
		pointer-events: none;
	}

	.title {
		position: relative;
		z-index: 2;
		grid-column: 1;
		grid-row: 1 / 3;
		align-self: end;
		display: grid;
		justify-items: start;
		gap: 1rem;
	}

	.hint {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		min-height: 2.75rem;
		padding: 0.25rem 1rem 0.25rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		font-size: 0.9375rem;
		color: var(--ink-2);
		background: var(--paper);
	}

	.hint b {
		font-weight: 500;
		color: var(--ink);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
	}

	.lead {
		position: relative;
		z-index: 2;
		grid-column: 2;
		grid-row: 2;
		display: grid;
		gap: 1.5rem;
		font-size: clamp(1.0625rem, 1.4vw, 1.3125rem);
		color: var(--ink-2);
	}

	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		font-size: 1rem;
		color: var(--ink);
	}

	.checks {
		padding-block: 8rem 6rem;
		scroll-margin-top: var(--nav-h);
	}

	.checks ul {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 2rem;
		margin-top: 3.5rem;
	}

	.checks li {
		padding-top: 20px;
		border-top: 1px solid var(--line);
	}

	.checks p {
		margin-top: 0.75rem;
		color: var(--ink-2);
	}

	.plans {
		padding-block: 2rem 6rem;
		outline: none;
		scroll-margin-top: calc(var(--nav-h) + 2rem);
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
		padding-top: 20px;
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

	.title-text {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.card a:hover .title-text {
		color: var(--accent-deep);
	}

	.closing {
		display: grid;
		justify-items: start;
		gap: 2rem;
		padding-block: 8rem;
		border-top: 1px solid var(--line);
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		padding: 1.5rem var(--shell) 1.5rem calc(var(--shell) + 1rem);
		border-top: 1px solid var(--line);
	}

	.foot a {
		display: inline-flex;
		align-items: center;
		min-height: 1.5rem;
		color: var(--ink);
	}

	@media (max-width: 767px) {
		main {
			padding-inline: var(--shell);
		}

		.hero {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto;
			min-height: auto;
			margin-inline: calc(var(--shell) * -1);
			padding: 6rem var(--shell) 3rem;
		}

		.drawing,
		.title,
		.lead {
			grid-column: 1;
			grid-row: auto;
			width: 100%;
		}

		.title {
			order: -1;
		}

		.foot {
			padding-inline: var(--shell);
		}
	}
</style>
