<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import {
		analyzePlan,
		getCatalogEntry,
		ItemGlyph,
		RoomOutline,
		XrayOverlay,
		type PlanData
	} from '#entities/plan';
	import type { ScrollTracker } from '../model/scroll.svelte';

	let { tracker, plan }: { tracker: ScrollTracker; plan: PlanData } = $props();

	const STEPS = [
		['벽', '방의 가로와 세로를 cm로 정합니다.'],
		['문과 창문', '문이 여닫히는 공간까지 함께 잡습니다.'],
		['격자', '5cm 격자와 벽에 맞춰 놓습니다.'],
		['가구', '책상과 TV장, 소파를 실제 크기로 놓습니다.'],
		['화면과 PC', '모니터, TV, PC, 게임기를 올립니다.'],
		['의자와 동선', '의자 뒤 60cm와 문에서 좌석까지의 통로를 봅니다.'],
		['전원', '콘센트와 멀티탭을 잇고 케이블 길이를 잽니다.'],
		['점검', '치수와 거리, 경고를 한 번에 확인합니다.']
	] as const;

	/** 물건 종류별로 나타나는 단계입니다. */
	const STEP_OF_KIND: Record<string, number> = {
		desk: 3,
		stand: 3,
		sofa: 3,
		subwoofer: 3,
		monitor: 4,
		tv: 4,
		pc: 4,
		console: 4,
		soundbar: 4,
		speaker: 4,
		receiver: 4,
		chair: 5,
		outlet: 6,
		strip: 6
	};
	const LAST = STEPS.length - 1;
	const MARGIN = 44;

	let section = $state<HTMLElement>();
	let sceneWidth = $state(0);

	const reduced = $derived(prefersReducedMotion.current);
	const progress = $derived.by(() => {
		if (reduced || !section) return reduced ? 1 : 0;
		const distance = section.offsetHeight - tracker.viewport;
		return distance > 0 ? Math.min(1, Math.max(0, (tracker.y - section.offsetTop) / distance)) : 0;
	});
	const step = $derived(Math.min(LAST, Math.floor(progress * STEPS.length)));
	const wallDraw = $derived(step > 0 ? 1 : progress * STEPS.length);
	const percent = $derived(String(Math.round(progress * 100)).padStart(3, '0'));

	const scale = $derived(sceneWidth > 0 ? sceneWidth / (plan.room.width + MARGIN * 2) : 1);
	const analysis = $derived(analyzePlan(plan.room, plan.items));
	const pieces = $derived(
		plan.items.map((item) => {
			const entry = getCatalogEntry(item.catalogId);
			return { item, entry, appearsAt: STEP_OF_KIND[entry.kind] ?? 3 };
		})
	);
	const byId = $derived(new Map(plan.items.map((item) => [item.id, item])));
	const gridLines = $derived({
		x: Array.from({ length: Math.floor(plan.room.width / 50) }, (_, i) => (i + 1) * 50),
		y: Array.from({ length: Math.floor(plan.room.depth / 50) }, (_, i) => (i + 1) * 50)
	});
</script>

<section
	bind:this={section}
	id="build"
	class="build"
	class:static={reduced}
	aria-labelledby="build-heading"
	data-section="과정"
>
	<div class="stage">
		<div class="copy">
			<p class="measure">
				<span lang="en">BUILD</span> <b data-testid="build-percent">{percent}%</b>
			</p>
			<h2 id="build-heading" class="display-2">선에서 <br />배치도까지.</h2>
			<ol>
				{#each STEPS as [title, body], index (title)}
					<li
						class:active={index === step}
						class:done={index < step}
						aria-current={index === step ? 'step' : undefined}
					>
						<span class="measure">0{index + 1}</span>
						<div>
							<h3 class="display-4">{title}</h3>
							<p class:collapsed={index !== step && !reduced}>{body}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>

		<div class="board" bind:clientWidth={sceneWidth}>
			<svg
				viewBox={`${-MARGIN} ${-MARGIN} ${plan.room.width + MARGIN * 2} ${plan.room.depth + MARGIN * 2}`}
				role="img"
				aria-label="벽에서 시작해 문, 가구, 전자기기, 의자, 전원 순서로 완성되는 방의 평면도"
			>
				<g class="layer" class:on={step >= 2}>
					{#each gridLines.x as x (x)}
						<line class="grid" {x} x1={x} x2={x} y1="0" y2={plan.room.depth} />
					{/each}
					{#each gridLines.y as y (y)}
						<line class="grid" x1="0" x2={plan.room.width} y1={y} y2={y} />
					{/each}
				</g>
				<g class="layer" class:on={step >= 1}><RoomOutline room={plan.room} /></g>
				{#if step === 0}
					<rect
						class="draw"
						width={plan.room.width}
						height={plan.room.depth}
						pathLength="1"
						stroke-dasharray="1"
						stroke-dashoffset={1 - wallDraw}
					/>
				{/if}
				<g class="layer" class:on={step >= 6}>
					{#each analysis.connections as connection (`${connection.fromId}-${connection.toId}`)}
						{@const from = byId.get(connection.fromId)}
						{@const to = byId.get(connection.toId)}
						{#if from && to}
							<line class="cable" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
						{/if}
					{/each}
				</g>
				{#each pieces as { item, entry, appearsAt } (item.id)}
					<g class="layer" class:on={step >= appearsAt}>
						<g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}>
							<ItemGlyph {entry} />
						</g>
					</g>
				{/each}
				<g class="layer" class:on={step >= LAST}>
					<XrayOverlay
						room={plan.room}
						items={plan.items}
						connections={analysis.connections}
						{scale}
					/>
				</g>
			</svg>
			<p class="result measure" class:on={step >= LAST}>
				오류 {analysis.errorCount}건 · 주의 {analysis.warningCount}건 · {analysis.power.totalWatts.toLocaleString(
					'ko-KR'
				)}W
			</p>
		</div>
	</div>
</section>

<style>
	.build {
		position: relative;
		height: 480vh;
	}

	.build.static {
		height: auto;
	}

	.stage {
		position: sticky;
		top: 0;
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		align-items: center;
		gap: clamp(1.5rem, 4vw, 4rem);
		height: 100svh;
		padding: calc(var(--nav-h) + 2.5rem) calc(var(--shell) + 1rem) 1.5rem;
		background-color: var(--paper);
		background-image: radial-gradient(
			color-mix(in srgb, var(--ink) 9%, transparent) 1px,
			transparent 1.2px
		);
		background-size: 24px 24px;
	}

	.static .stage {
		position: static;
		height: auto;
		padding-block: 6rem;
	}

	.copy {
		display: grid;
		gap: 1.25rem;
		min-width: 0;
	}

	.copy > .measure b {
		font-weight: 400;
		color: var(--ink);
	}

	ol {
		display: grid;
	}

	li {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr);
		align-items: baseline;
		padding-block: 0.3125rem;
		border-top: 1px solid var(--line);
		color: var(--steel);
		transition: color 0.3s var(--ease);
	}

	li.done {
		color: var(--ink-2);
	}

	li.active {
		color: var(--ink);
	}

	li.active .measure {
		color: var(--accent-deep);
	}

	h3 {
		font-size: 1.125rem;
	}

	li p {
		margin-top: 0.125rem;
		font-size: 0.9375rem;
		color: var(--ink-2);
	}

	/* 진행 중이 아닌 단계의 설명은 화면에서만 접고 보조기술에는 그대로 둡니다. */
	.collapsed {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		white-space: nowrap;
		clip-path: inset(50%);
	}

	.board {
		position: relative;
		display: grid;
		min-width: 0;
		max-height: 100%;
		padding: 0.75rem;
		border-radius: var(--radius-media);
		background: var(--paper);
		box-shadow:
			0 0 0 1px var(--line),
			0 40px 80px -24px rgb(18 18 20 / 0.28);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		max-height: calc(100svh - var(--nav-h) - 8rem);
		color: var(--ink);
	}

	.layer {
		opacity: 0;
		transition: opacity 0.45s var(--ease);
	}

	.layer.on {
		opacity: 1;
	}

	.draw {
		fill: none;
		stroke: var(--ink);
		stroke-width: 3;
		vector-effect: non-scaling-stroke;
	}

	.grid {
		stroke: var(--line);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	.cable {
		stroke: var(--steel);
		stroke-dasharray: 2 5;
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	.result {
		justify-self: end;
		color: var(--ink);
		opacity: 0;
		transition: opacity 0.45s var(--ease);
	}

	.result.on {
		opacity: 1;
	}

	@media (max-width: 900px) {
		.stage {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto minmax(0, 1fr);
			align-items: start;
			gap: 0.75rem;
			padding: 4.75rem var(--shell) 0.75rem;
		}

		h2 br {
			display: none;
		}

		.copy {
			gap: 0.5rem;
		}

		/* 좁은 화면에서는 진행 중인 단계만 보여 줍니다. */
		li:not(.active) {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}

		.static li:not(.active) {
			position: static;
			width: auto;
			height: auto;
			clip-path: none;
		}

		svg {
			max-height: 52svh;
		}
	}
</style>
