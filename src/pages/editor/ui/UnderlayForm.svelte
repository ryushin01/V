<script lang="ts">
	import { Button, Dialog, Icon, NumberField } from '#shared/ui';
	import { loadImage, validateImageFile } from '../lib/load-image';
	import type { EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();

	let fileInput = $state<HTMLInputElement>();
	let error = $state('');
	let realLength = $state(100);

	const image = $derived(session.underlay);
	const width = $derived(image ? image.pixelWidth * image.cmPerPixel : 0);
	const calibrating = $derived(session.calibration !== null);
	const pointCount = $derived(session.calibration?.points.length ?? 0);

	async function handleFile(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const invalid = validateImageFile(file);
		error = invalid ?? '';
		if (invalid) return;
		try {
			session.setUnderlay(await loadImage(file));
		} catch {
			error = '이미지를 읽지 못했습니다. 다른 파일을 골라 주세요.';
		}
	}

	function apply() {
		session.applyCalibration(realLength);
	}

	/** 다이얼로그를 Esc나 닫기로 닫으면 축척 맞추기를 취소합니다. */
	const dialogOpen = {
		get open() {
			return pointCount === 2;
		},
		set open(value: boolean) {
			if (!value && session.calibration) session.cancelCalibration();
		}
	};
</script>

<section class="panel" aria-labelledby="underlay-heading">
	<h2 id="underlay-heading">평면도 이미지</h2>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/jpeg,image/png,image/webp"
		hidden
		onchange={handleFile}
		data-testid="underlay-file"
	/>
	{#if error}<p class="error" role="alert">{error}</p>{/if}

	{#if image}
		<div class="grid">
			<NumberField
				label="이미지 실제 가로"
				unit="cm"
				min={10}
				max={5000}
				value={width}
				oncommit={(value) => session.updateUnderlay({ cmPerPixel: value / image.pixelWidth })}
			/>
			<NumberField
				label="불투명도"
				unit="%"
				min={10}
				max={100}
				value={Math.round(image.opacity * 100)}
				oncommit={(value) => session.updateUnderlay({ opacity: value / 100 })}
			/>
			<NumberField
				label="이미지 X"
				unit="cm"
				min={-5000}
				max={5000}
				value={image.x}
				oncommit={(value) => session.updateUnderlay({ x: value })}
			/>
			<NumberField
				label="이미지 Y"
				unit="cm"
				min={-5000}
				max={5000}
				value={image.y}
				oncommit={(value) => session.updateUnderlay({ y: value })}
			/>
		</div>
		{#if calibrating}
			<p class="note" role="status">
				도면에서 길이를 아는 {pointCount === 0 ? '첫 번째' : '두 번째'} 점을 눌러 주세요. Esc로 취소합니다.
			</p>
		{/if}
		<div class="actions">
			{#if calibrating}
				<Button size="sm" onclick={() => session.cancelCalibration()}>취소</Button>
			{:else}
				<Button size="sm" onclick={() => session.startCalibration()}>두 점으로 축척 맞추기</Button>
			{/if}
			<Button size="sm" onclick={() => fileInput?.click()}>이미지 바꾸기</Button>
			<Button
				size="sm"
				variant="danger"
				aria-label="평면도 이미지 삭제"
				onclick={() => session.removeUnderlay()}
			>
				<Icon name="trash" size={16} /> 삭제
			</Button>
		</div>
	{:else}
		<p class="note">집 도면 사진을 깔고 그 위에 배치합니다. 이미지는 이 브라우저에만 저장됩니다.</p>
		<div class="actions">
			<Button size="sm" onclick={() => fileInput?.click()}>
				<Icon name="upload" size={16} /> 이미지 올리기
			</Button>
		</div>
	{/if}
</section>

<Dialog bind:open={dialogOpen.open} title="두 점 사이의 실제 길이">
	<NumberField
		label="실제 길이"
		unit="cm"
		min={1}
		max={5000}
		value={realLength}
		oncommit={(value) => (realLength = value)}
	/>
	{#snippet actions()}
		<Button onclick={() => session.cancelCalibration()}>취소</Button>
		<Button variant="primary" onclick={apply}>적용</Button>
	{/snippet}
</Dialog>

<style>
	.panel {
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
		border-bottom: 1px solid var(--line);
	}

	h2 {
		font-family: var(--font-display);
		font-size: 1.125rem;
		letter-spacing: -0.02em;
	}

	.note {
		font-size: 0.875rem;
		color: var(--ink-2);
	}

	.error {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--accent-deep);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
</style>
