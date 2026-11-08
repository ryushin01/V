<script lang="ts">
	import type { EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();
</script>

<section class="panel" aria-labelledby="items-heading">
	<h2 id="items-heading">놓은 물건 <span class="measure">{session.items.length}</span></h2>
	{#if session.items.length === 0}
		<p class="empty">왼쪽 목록에서 물건을 추가해 주세요.</p>
	{:else}
		<ul>
			{#each session.items as item (item.id)}
				<li>
					<button
						type="button"
						aria-pressed={session.selectedId === item.id}
						onclick={() => {
							session.select(item.id);
							session.requestFocus(item.id);
						}}
					>
						<span>{item.name}</span>
						<span class="measure">{Math.round(item.x)}, {Math.round(item.y)}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.panel {
		padding: 1rem;
		border-bottom: 1px solid var(--line);
	}

	h2 {
		margin-bottom: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.125rem;
		letter-spacing: -0.02em;
	}

	.empty {
		font-size: 0.875rem;
		color: var(--ink-2);
	}

	button {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: center;
		width: 100%;
		min-height: 2.25rem;
		padding: 0 0.5rem;
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

	button[aria-pressed='true'] {
		box-shadow: inset 2px 0 0 var(--accent-deep);
		background: var(--paper-2);
	}
</style>
