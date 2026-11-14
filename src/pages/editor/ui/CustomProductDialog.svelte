<script lang="ts">
	import { tick } from 'svelte';
	import { Button, Dialog, NumberField, Select } from '#shared/ui';
	import {
		createCustomEntry,
		CustomProductLimitError,
		CUSTOM_KINDS,
		DEFAULT_SCREEN_INCH,
		deleteCustomProduct,
		ItemGlyph,
		KIND_PRESETS,
		saveCustomProduct,
		SPEC_LIMITS,
		toCustomInput,
		type CatalogEntry,
		type CustomProductInput
	} from '#entities/plan';

	interface Props {
		open: boolean;
		/** 고칠 제품. 없으면 새로 등록합니다. */
		editing: CatalogEntry | null;
		onsaved: (entry: CatalogEntry, place: boolean) => void;
		ondeleted: (id: string) => void;
	}

	let { open = $bindable(), editing, onsaved, ondeleted }: Props = $props();

	const EMPTY: CustomProductInput = {
		name: '',
		brand: '',
		kind: 'desk',
		width: 120,
		depth: 60,
		watts: 0,
		cable: 150,
		glyph: ''
	};

	let input = $state<CustomProductInput>({ ...EMPTY });
	let place = $state(true);
	let nameError = $state('');
	let saveError = $state('');
	let confirmDelete = $state(false);
	let busy = false;

	// 창을 열 때마다 입력값을 새로 채웁니다.
	$effect(() => {
		if (!open) return;
		input = editing ? toCustomInput(editing) : { ...EMPTY };
		nameError = '';
		saveError = '';
		confirmDelete = false;
		busy = false;
	});

	const preset = $derived(KIND_PRESETS[input.kind]);
	const preview = $derived(createCustomEntry({ ...input, name: input.name || '미리보기' }));
	const title = $derived(editing ? '내 제품 고치기' : '제품 등록');

	function changeKind(kind: CustomProductInput['kind']) {
		input.kind = kind;
		input.glyph = KIND_PRESETS[kind].glyphs[0].id;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		saveError = '';
		if (!input.name.trim()) {
			nameError = '제품 이름을 입력해 주세요.';
			return;
		}
		busy = true;
		nameError = '';
		const form = event.currentTarget as HTMLFormElement;
		// 이름 오류 해제와 숫자 칸의 오류 표시를 화면에 반영한 뒤 오류 칸을 찾습니다.
		await tick();
		const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
		if (invalid) {
			busy = false;
			saveError = '잘못 입력한 값을 고친 뒤 저장해 주세요.';
			invalid.focus();
			return;
		}
		try {
			const entry = createCustomEntry(input);
			await saveCustomProduct(entry);
			onsaved(entry, !editing && place);
			open = false;
		} catch (error) {
			busy = false;
			saveError =
				error instanceof CustomProductLimitError
					? `${error.message} 쓰지 않는 제품을 지운 뒤 등록해 주세요.`
					: '저장하지 못했습니다. 비공개 창이라면 일반 창에서 열어 주세요.';
		}
	}

	async function remove() {
		if (!editing || busy) return;
		busy = true;
		try {
			await deleteCustomProduct(editing.id);
			ondeleted(editing.id);
			open = false;
		} catch {
			busy = false;
			saveError = '삭제하지 못했습니다.';
		}
	}
</script>

<Dialog bind:open {title}>
	<form id="custom-product-form" class="form" onsubmit={submit} novalidate>
		<p class="note">
			등록한 제품은 이 브라우저의 모든 배치도에서 쓸 수 있고, 배치도를 내보내거나 공유할 때 함께
			담깁니다.
		</p>
		<div class="row">
			<div class="field">
				<label for="custom-name">제품 이름 (필수)</label>
				<input
					id="custom-name"
					type="text"
					maxlength="40"
					autocomplete="off"
					required
					bind:value={input.name}
					aria-invalid={nameError ? 'true' : undefined}
					aria-describedby={nameError ? 'custom-name-error' : undefined}
				/>
				{#if nameError}<p id="custom-name-error" class="error">{nameError}</p>{/if}
			</div>
			<div class="field">
				<label for="custom-brand">제조사</label>
				<input
					id="custom-brand"
					type="text"
					maxlength="30"
					autocomplete="off"
					bind:value={input.brand}
				/>
			</div>
		</div>
		<div class="row">
			<Select
				label="종류"
				id="custom-kind"
				value={input.kind}
				onchange={(event) => changeKind(event.currentTarget.value as CustomProductInput['kind'])}
			>
				{#each CUSTOM_KINDS as kind (kind)}
					<option value={kind}>{KIND_PRESETS[kind].label}</option>
				{/each}
			</Select>
			<Select label="그림" id="custom-glyph" bind:value={input.glyph}>
				{#each preset.glyphs as option (option.id)}
					<option value={option.id}>{option.label}</option>
				{/each}
			</Select>
		</div>
		<div class="row">
			<NumberField
				label="가로"
				unit="cm"
				min={SPEC_LIMITS.width.min}
				max={SPEC_LIMITS.width.max}
				value={input.width}
				oncommit={(value) => (input.width = value)}
			/>
			<NumberField
				label="세로"
				unit="cm"
				min={SPEC_LIMITS.depth.min}
				max={SPEC_LIMITS.depth.max}
				value={input.depth}
				oncommit={(value) => (input.depth = value)}
			/>
			<NumberField
				label="소비 전력"
				unit="W"
				min={0}
				max={SPEC_LIMITS.watts.max}
				value={input.watts}
				hint="0이면 전원이 없거나 USB 전원"
				oncommit={(value) => (input.watts = value)}
			/>
			<NumberField
				label="케이블 길이"
				unit="cm"
				min={0}
				max={SPEC_LIMITS.cable.max}
				value={input.cable}
				oncommit={(value) => (input.cable = value)}
			/>
			{#if preset.hasScreen}
				<NumberField
					label="화면 크기"
					unit="인치"
					min={SPEC_LIMITS.diagonalInch.min}
					max={SPEC_LIMITS.diagonalInch.max}
					value={input.diagonalInch ?? DEFAULT_SCREEN_INCH}
					oncommit={(value) => (input.diagonalInch = value)}
				/>
			{/if}
			{#if preset.hasPorts}
				<NumberField
					label="콘센트 구"
					unit="구"
					min={SPEC_LIMITS.ports.min}
					max={SPEC_LIMITS.ports.max}
					value={input.ports ?? 2}
					oncommit={(value) => (input.ports = value)}
				/>
			{/if}
		</div>
		<figure class="preview">
			<svg
				viewBox={`${-preview.width / 2 - 4} ${-preview.depth / 2 - 4} ${preview.width + 8} ${preview.depth + 8}`}
				role="img"
				aria-label={`${preset.label} 그림 미리보기, 가로 ${preview.width}cm, 세로 ${preview.depth}cm`}
			>
				<ItemGlyph entry={preview} />
			</svg>
			<figcaption class="measure">{preview.width} × {preview.depth} cm</figcaption>
		</figure>
		{#if !editing}
			<label class="check"
				><input type="checkbox" bind:checked={place} /> 등록하고 배치도에 놓기</label
			>
		{/if}
		{#if saveError}<p class="error" role="alert">{saveError}</p>{/if}
		{#if editing && confirmDelete}
			<p class="error" role="alert">
				삭제하면 목록에서 사라집니다. 이미 놓은 배치도는 그대로 열립니다.
			</p>
		{/if}
	</form>
	{#snippet actions()}
		{#if editing}
			{#if confirmDelete}
				<Button variant="danger" onclick={remove}>삭제 확인</Button>
			{:else}
				<Button variant="danger" onclick={() => (confirmDelete = true)}>삭제</Button>
			{/if}
		{/if}
		<Button onclick={() => (open = false)}>취소</Button>
		<Button variant="primary" type="submit" form="custom-product-form"
			>{editing ? '저장' : '등록'}</Button
		>
	{/snippet}
</Dialog>

<style>
	.form {
		display: grid;
		gap: 0.875rem;
	}

	.note {
		font-size: 0.875rem;
		color: var(--ink-2);
	}

	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem;
	}

	.field {
		display: grid;
		align-content: start;
		gap: 0.25rem;
		min-width: 0;
	}

	label {
		font-size: 0.8125rem;
		color: var(--ink-2);
	}

	input[type='text'] {
		width: 100%;
		min-height: 2.5rem;
		padding: 0 0.625rem;
		border: 1px solid var(--control);
		border-radius: var(--radius-field);
		font-size: 0.875rem;
		color: var(--ink);
		background: var(--paper);
	}

	input[aria-invalid='true'] {
		border-color: var(--accent-deep);
	}

	.preview {
		display: grid;
		justify-items: center;
		gap: 0.25rem;
		margin: 0;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-field);
		background: var(--paper-2);
		color: var(--ink);
	}

	.preview svg {
		width: 100%;
		max-width: 18rem;
		height: 7rem;
	}

	.check {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.25rem;
		font-size: 0.875rem;
		color: var(--ink);
	}

	.check input {
		width: 1.125rem;
		height: 1.125rem;
		accent-color: var(--accent-deep);
	}

	.error {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--accent-deep);
	}
</style>
