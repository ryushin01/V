<script lang="ts">
	import { Icon, type IconName } from '#shared/ui';
	import type { Finding } from '#entities/plan';
	import type { EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const analysis = $derived(session.analysis);
	const SEVERITY: Record<Finding['severity'], { icon: IconName; label: string }> = {
		error: { icon: 'stop', label: '오류' },
		warning: { icon: 'alert', label: '주의' },
		ok: { icon: 'check', label: '통과' }
	};

	function reveal(finding: Finding) {
		const [first] = finding.itemIds;
		if (!first) return;
		session.select(first);
		session.requestFocus(first);
	}
</script>

<section class="panel" aria-labelledby="review-heading">
	<h2 id="review-heading">점검</h2>
	<dl class="totals">
		<div>
			<dt>소비 전력</dt>
			<dd>{analysis.power.totalWatts.toLocaleString('ko-KR')}W</dd>
		</div>
		<div>
			<dt>콘센트 구</dt>
			<dd>{analysis.power.portsUsed}/{analysis.power.portsTotal}</dd>
		</div>
		<div>
			<dt>전원 연결</dt>
			<dd>{analysis.power.connected}/{analysis.power.devices}대</dd>
		</div>
		<div>
			<dt>합계</dt>
			<dd>{analysis.cost.toLocaleString('ko-KR')}원</dd>
		</div>
	</dl>

	<p class="summary">오류 {analysis.errorCount}건 · 주의 {analysis.warningCount}건</p>

	{#if analysis.findings.length === 0}
		<p class="empty">물건을 놓으면 겹침, 동선, 시청 거리, 전력을 점검합니다.</p>
	{:else}
		<ul>
			{#each analysis.findings as finding (finding.id)}
				{@const severity = SEVERITY[finding.severity]}
				<li class={finding.severity}>
					<button
						type="button"
						disabled={finding.itemIds.length === 0}
						onclick={() => reveal(finding)}
					>
						<Icon name={severity.icon} size={18} />
						<span class="text">
							<strong><span class="tag">{severity.label}</span> {finding.title}</strong>
							<span class="detail">{finding.detail}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.panel {
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
	}

	h2 {
		font-family: var(--font-display);
		font-size: 1.125rem;
		letter-spacing: -0.02em;
	}

	.totals {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin: 0;
	}

	.totals div {
		padding-top: 0.5rem;
		border-top: 1px solid var(--line);
	}

	dt {
		font-size: 0.75rem;
		color: var(--ink-2);
	}

	dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}

	.summary {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.empty {
		font-size: 0.875rem;
		color: var(--ink-2);
	}

	ul {
		display: grid;
		gap: 0.25rem;
	}

	button {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.5rem;
		width: 100%;
		min-height: 2.75rem;
		padding: 0.5rem;
		border: 0;
		border-radius: var(--radius-field);
		font-size: 0.875rem;
		text-align: left;
		color: var(--ink);
		background: transparent;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: var(--paper-2);
	}

	button:disabled {
		cursor: default;
	}

	.error :global(svg),
	.warning :global(svg) {
		color: var(--accent-deep);
	}

	.ok :global(svg) {
		color: var(--ok);
	}

	.text {
		display: grid;
		gap: 0.125rem;
	}

	strong {
		font-weight: 600;
	}

	.tag {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
	}

	.error .tag,
	.warning .tag {
		color: var(--accent-deep);
	}

	.ok .tag {
		color: var(--ok);
	}

	.detail {
		color: var(--ink-2);
	}
</style>
