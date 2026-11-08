<script lang="ts">
	import { Button, Icon, NumberField } from '#shared/ui';
	import { SPEC_LIMITS, type SpecKey } from '#entities/plan';
	import type { PlacedItem } from '../model/placed-item.svelte';
	import type { EditorSession } from '../model/session.svelte';

	let { session, item }: { session: EditorSession; item: PlacedItem } = $props();

	const isWall = $derived(item.entry.layer === 'wall');
	const SPEC_FIELDS: { key: SpecKey; label: string; unit: string }[] = [
		{ key: 'width', label: '가로', unit: 'cm' },
		{ key: 'depth', label: '세로', unit: 'cm' },
		{ key: 'diagonalInch', label: '화면 크기', unit: '인치' },
		{ key: 'watts', label: '소비 전력', unit: 'W' },
		{ key: 'cable', label: '케이블 길이', unit: 'cm' },
		{ key: 'ports', label: '콘센트 구', unit: '구' }
	];
	const specFields = $derived(
		SPEC_FIELDS.filter(({ key }) => {
			const value = item.entry[key];
			return value !== undefined && (key === 'width' || key === 'depth' || value > 0);
		})
	);
</script>

<section class="panel" aria-labelledby="item-heading">
	<h2 id="item-heading">선택한 물건</h2>

	<div class="field">
		<label for="item-name">이름</label>
		<input
			id="item-name"
			type="text"
			maxlength="40"
			autocomplete="off"
			placeholder={item.entry.name}
			value={item.label}
			oninput={(event) => session.setLabel(item.id, event.currentTarget.value)}
		/>
	</div>

	<div class="grid">
		<NumberField
			label="X"
			unit="cm"
			min={0}
			max={session.room.width}
			value={item.x}
			oncommit={(value) => session.setPosition(item.id, 'x', value)}
		/>
		<NumberField
			label="Y"
			unit="cm"
			min={0}
			max={session.room.depth}
			value={item.y}
			oncommit={(value) => session.setPosition(item.id, 'y', value)}
		/>
		{#if !isWall}
			<NumberField
				label="회전"
				unit="°"
				min={0}
				max={359}
				value={item.rotation}
				oncommit={(value) => session.setRotation(item.id, value)}
			/>
		{/if}
		<NumberField
			label="가격"
			unit="원"
			min={0}
			max={100000000}
			step={1000}
			value={item.price}
			oncommit={(value) => session.setPrice(item.id, value)}
		/>
	</div>

	<fieldset>
		<legend>규격</legend>
		<div class="grid">
			{#each specFields as field (field.key)}
				<NumberField
					label={field.label}
					unit={field.unit}
					min={SPEC_LIMITS[field.key].min}
					max={SPEC_LIMITS[field.key].max}
					value={item.entry[field.key] ?? 0}
					oncommit={(value) => session.setSpec(item.id, field.key, value)}
				/>
			{/each}
		</div>
		{#if Object.keys(item.specs).length > 0}
			<Button size="sm" onclick={() => session.resetSpecs(item.id)}>기본 규격으로</Button>
		{/if}
	</fieldset>

	<div class="actions">
		{#if !isWall}
			<Button size="sm" onclick={() => session.rotate(item.id, -15)}
				><Icon name="rotateLeft" size={16} /> 왼쪽 15°</Button
			>
			<Button size="sm" onclick={() => session.rotate(item.id, 15)}
				><Icon name="rotateRight" size={16} /> 오른쪽 15°</Button
			>
		{/if}
		<Button size="sm" disabled={!session.canAddItem} onclick={() => session.duplicateItem(item.id)}
			><Icon name="copy" size={16} /> 복제</Button
		>
		<Button size="sm" variant="danger" onclick={() => session.removeItem(item.id)}
			><Icon name="trash" size={16} /> 삭제</Button
		>
	</div>
</section>

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

	.field {
		display: grid;
		gap: 0.25rem;
	}

	label {
		font-size: 0.8125rem;
		color: var(--ink-2);
	}

	input {
		min-height: 2.5rem;
		padding: 0 0.625rem;
		border: 1px solid var(--control);
		border-radius: var(--radius-field);
		font-size: 0.875rem;
		color: var(--ink);
		background: var(--paper);
	}

	fieldset {
		display: grid;
		justify-items: start;
		gap: 0.625rem;
		min-width: 0;
		margin: 0;
		padding: 0.75rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-field);
	}

	fieldset .grid {
		width: 100%;
	}

	legend {
		padding: 0 0.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
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
