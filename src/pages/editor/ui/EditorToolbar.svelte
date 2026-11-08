<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Dialog, Icon } from '#shared/ui';
	import { stringifyPlan } from '#entities/plan';
	import { ThemeToggle } from '#features/toggle-theme';
	import type { EditorSession } from '../model/session.svelte';

	type SaveStatus = 'saved' | 'saving' | 'error';

	let { session, saveStatus }: { session: EditorSession; saveStatus: SaveStatus } = $props();

	let helpOpen = $state(false);

	const SAVE_LABEL: Record<SaveStatus, string> = {
		saved: '저장됨',
		saving: '저장 중',
		error: '저장 실패: 파일로 내보내 보관해 주세요'
	};

	const SHORTCUTS = [
		['방향키', '선택한 물건 10cm 이동'],
		['Shift + 방향키', '1cm 이동'],
		['R / Shift + R', '15° 회전 / 반대로 회전'],
		['Delete', '삭제'],
		['Enter', '이름과 수치 입력으로 이동'],
		['Ctrl(⌘) + Z', '되돌리기'],
		['Ctrl(⌘) + Shift + Z', '다시 하기'],
		['Esc', '끌던 동작 취소'],
		['Shift + 끌기', '격자 맞춤 없이 이동']
	] as const;

	function exportFile() {
		const blob = new Blob([stringifyPlan(session.toData())], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${session.name.replace(/[\\/:*?"<>|]/g, '_') || 'plan'}.json`;
		link.click();
		URL.revokeObjectURL(url);
		session.announcement = 'JSON 파일로 내보냈습니다.';
	}
</script>

<header class="toolbar">
	<a class="mark" href={resolve('/')} aria-label="V 배치도 목록으로"
		>V<span class="tick" aria-hidden="true"></span></a
	>
	<div class="name">
		<label class="sr-only" for="plan-name">배치도 이름</label>
		<input id="plan-name" type="text" maxlength="60" autocomplete="off" bind:value={session.name} />
	</div>
	<p class="status measure" class:failed={saveStatus === 'error'} role="status">
		{SAVE_LABEL[saveStatus]}
	</p>
	<div class="actions">
		<Button
			size="sm"
			aria-label="되돌리기"
			title="되돌리기"
			disabled={!session.canUndo}
			onclick={() => session.undo()}><Icon name="undo" /></Button
		>
		<Button
			size="sm"
			aria-label="다시 하기"
			title="다시 하기"
			disabled={!session.canRedo}
			onclick={() => session.redo()}><Icon name="redo" /></Button
		>
		<Button size="sm" onclick={exportFile}><Icon name="download" size={16} /> 내보내기</Button>
		<Button size="sm" aria-label="단축키 안내" title="단축키 안내" onclick={() => (helpOpen = true)}
			><Icon name="keyboard" /></Button
		>
		<ThemeToggle />
	</div>
</header>

<Dialog bind:open={helpOpen} title="키보드 조작">
	<dl class="keys">
		{#each SHORTCUTS as [key, action] (key)}
			<div>
				<dt class="measure">{key}</dt>
				<dd>{action}</dd>
			</div>
		{/each}
	</dl>
	{#snippet actions()}
		<Button variant="primary" onclick={() => (helpOpen = false)}>닫기</Button>
	{/snippet}
</Dialog>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
		min-height: 3.5rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--line);
	}

	.mark {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.1875rem;
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0.5rem;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.1;
		color: inherit;
		text-decoration: none;
	}

	.tick {
		width: 2px;
		height: 0.5rem;
		margin-bottom: 0.25rem;
		background: var(--accent);
	}

	.name {
		flex: 1 1 10rem;
		min-width: 0;
		max-width: 26rem;
	}

	input {
		width: 100%;
		min-height: 2.5rem;
		padding: 0 0.625rem;
		border: 1px solid transparent;
		border-radius: var(--radius-field);
		font-size: 1rem;
		font-weight: 500;
		color: var(--ink);
		background: transparent;
	}

	input:hover {
		border-color: var(--control);
	}

	.status {
		white-space: nowrap;
	}

	.status.failed {
		color: var(--accent-deep);
		white-space: normal;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-left: auto;
	}

	.keys {
		display: grid;
		gap: 0.5rem;
		margin: 0;
	}

	.keys div {
		display: grid;
		grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
		gap: 0.75rem;
	}

	.keys dd {
		margin: 0;
		font-size: 0.9375rem;
	}
</style>
