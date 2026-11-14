<script lang="ts">
	interface Props {
		label: string;
		value: number;
		min: number;
		max: number;
		step?: number;
		unit?: string;
		id?: string;
		/** 입력란 아래에 늘 보이는 설명 */
		hint?: string;
		oncommit: (value: number) => void;
	}

	const uid = $props.id();
	let { label, value, min, max, step = 1, unit = '', id = uid, hint, oncommit }: Props = $props();

	// 외부 값이 바뀌면 다시 계산되고, 입력 중에는 덮어쓸 수 있는 파생 상태입니다.
	let draft = $derived(String(Math.round(value * 100) / 100));
	let error = $state('');

	/** 쉼표 소수(29,4)도 받습니다. 비어 있으면 NaN입니다. */
	function parseDraft(text: string): number {
		const trimmed = text.trim().replace(',', '.');
		return trimmed === '' ? Number.NaN : Number(trimmed);
	}

	const parsedDraft = $derived(parseDraft(draft));
	/** 확정 전이라도 비었거나 숫자가 아니거나 범위를 벗어나면 오류 상태로 알립니다. */
	const draftInRange = $derived(
		Number.isFinite(parsedDraft) && parsedDraft >= min && parsedDraft <= max
	);

	/** type="number"는 '29.'처럼 입력 중인 소수를 비워 버려 글자 입력으로 받고, 위아래 방향키로 증감합니다. */
	function stepWithArrows(event: KeyboardEvent) {
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
		const current = parseDraft(draft);
		if (!Number.isFinite(current)) return;
		event.preventDefault();
		const next = Math.min(max, Math.max(min, current + (event.key === 'ArrowUp' ? step : -step)));
		draft = String(Math.round(next * 100) / 100);
		commit();
	}

	function commit() {
		const parsed = parseDraft(draft);
		if (draft.trim() === '' || !Number.isFinite(parsed)) {
			error = '숫자를 입력해 주세요.';
			return;
		}
		if (parsed < min || parsed > max) {
			error = `${min}~${max}${unit} 사이로 입력해 주세요.`;
			return;
		}
		error = '';
		oncommit(parsed);
	}
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="control">
		<input
			{id}
			type="text"
			role="spinbutton"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={draftInRange ? parsedDraft : undefined}
			inputmode="decimal"
			autocomplete="off"
			spellcheck="false"
			value={draft}
			oninput={(event) => (draft = event.currentTarget.value)}
			onchange={commit}
			onkeydown={stepWithArrows}
			aria-invalid={error || !draftInRange ? 'true' : undefined}
			aria-describedby={[hint ? `${id}-hint` : '', error ? `${id}-error` : '']
				.filter(Boolean)
				.join(' ') || undefined}
		/>
		{#if unit}<span class="unit" aria-hidden="true">{unit}</span>{/if}
	</div>
	{#if hint}<p id={`${id}-hint`} class="hint">{hint}</p>{/if}
	{#if error}<p id={`${id}-error`} class="error">{error}</p>{/if}
</div>

<style>
	.field {
		display: grid;
		/* 옆 칸에 설명이 붙어 줄이 높아져도 입력란은 위에 붙여 같은 높이에 둡니다. */
		align-content: start;
		gap: 0.25rem;
		min-width: 0;
	}

	label {
		font-size: 0.8125rem;
		color: var(--ink-2);
	}

	.control {
		position: relative;
	}

	input {
		width: 100%;
		min-height: 2.5rem;
		padding: 0 2.25rem 0 0.625rem;
		border: 1px solid var(--control);
		border-radius: var(--radius-field);
		font-family: var(--font-mono);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		background: var(--paper);
	}

	input[aria-invalid='true'] {
		border-color: var(--accent-deep);
	}

	.unit {
		position: absolute;
		top: 50%;
		right: 0.625rem;
		transform: translateY(-50%);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--steel);
		pointer-events: none;
	}

	.hint {
		margin: 0;
		font-size: 0.75rem;
		color: var(--ink-2);
	}

	.error {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--accent-deep);
	}
</style>
