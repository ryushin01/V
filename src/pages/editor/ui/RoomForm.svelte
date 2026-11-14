<script lang="ts">
	import { Button, Icon, NumberField, Select } from '#shared/ui';
	import {
		CORNER_LABELS,
		cutoutLimits,
		ROOM_LIMITS,
		WALL_LABELS,
		wallRange,
		type Corner,
		type Opening,
		type Wall
	} from '#entities/plan';
	import type { EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();

	const walls = Object.keys(WALL_LABELS) as Wall[];
	const kindLabel = (opening: Opening) => (opening.kind === 'door' ? '문' : '창문');
</script>

<section class="panel" aria-labelledby="room-heading">
	<h2 id="room-heading">방</h2>
	<div class="grid">
		<NumberField
			label="가로"
			unit="cm"
			min={ROOM_LIMITS.min}
			max={ROOM_LIMITS.max}
			value={session.room.width}
			oncommit={(value) => session.setRoomSize('width', value)}
		/>
		<NumberField
			label="세로"
			unit="cm"
			min={ROOM_LIMITS.min}
			max={ROOM_LIMITS.max}
			value={session.room.depth}
			oncommit={(value) => session.setRoomSize('depth', value)}
		/>
	</div>

	<h3>모서리 잘라내기</h3>
	<p class="empty">ㄱ자, ㄴ자, T자처럼 모서리가 빠진 방을 만듭니다.</p>
	{#if session.room.cutouts?.length}
		<ul>
			{#each session.room.cutouts as cutout (cutout.id)}
				{@const limits = cutoutLimits(session.room, cutout.corner)}
				{@const name = `${CORNER_LABELS[cutout.corner]} 모서리`}
				<li>
					<fieldset>
						<legend>{name}</legend>
						<div class="grid">
							<Select
								label="위치"
								id={`corner-${cutout.id}`}
								value={cutout.corner}
								onchange={(event) =>
									session.updateCutout(cutout.id, {
										corner: event.currentTarget.value as Corner
									})}
							>
								<option value={cutout.corner}>{CORNER_LABELS[cutout.corner]}</option>
								{#each session.freeCorners as corner (corner)}
									<option value={corner}>{CORNER_LABELS[corner]}</option>
								{/each}
							</Select>
							<NumberField
								label="잘라 낸 가로"
								unit="cm"
								min={limits.min}
								max={limits.maxWidth}
								value={cutout.width}
								oncommit={(value) => session.updateCutout(cutout.id, { width: value })}
							/>
							<NumberField
								label="잘라 낸 세로"
								unit="cm"
								min={limits.min}
								max={limits.maxDepth}
								value={cutout.depth}
								oncommit={(value) => session.updateCutout(cutout.id, { depth: value })}
							/>
						</div>
						<Button
							size="sm"
							variant="danger"
							aria-label={`${name} 되돌리기`}
							onclick={() => session.removeCutout(cutout.id)}
							><Icon name="trash" size={16} /> 되돌리기</Button
						>
					</fieldset>
				</li>
			{/each}
		</ul>
	{/if}
	<div class="actions">
		<Button
			size="sm"
			disabled={session.freeCorners.length === 0}
			onclick={() => session.addCutout()}><Icon name="plus" size={16} /> 모서리 잘라내기</Button
		>
	</div>

	<h3>문과 창문</h3>
	{#if session.room.openings.length === 0}
		<p class="empty">아직 없습니다. 문을 추가하면 통로와 여닫는 공간을 점검합니다.</p>
	{/if}
	<ul>
		{#each session.room.openings as opening, index (opening.id)}
			{@const name = `${kindLabel(opening)} ${index + 1}`}
			<li>
				<fieldset>
					<legend>{name}</legend>
					<div class="grid">
						<Select
							label="벽"
							id={`wall-${opening.id}`}
							value={opening.wall}
							onchange={(event) =>
								session.updateOpening(opening.id, { wall: event.currentTarget.value as Wall })}
						>
							{#each walls as wall (wall)}
								<option value={wall}>{WALL_LABELS[wall]}</option>
							{/each}
						</Select>
						{#if opening.kind === 'door'}
							<Select
								label="경첩"
								id={`hinge-${opening.id}`}
								value={opening.hinge}
								onchange={(event) =>
									session.updateOpening(opening.id, {
										hinge: event.currentTarget.value as Opening['hinge']
									})}
							>
								<option value="start">시작 쪽</option>
								<option value="end">끝 쪽</option>
							</Select>
						{/if}
						<NumberField
							label="벽 시작점에서"
							unit="cm"
							min={wallRange(session.room, opening.wall).start}
							max={wallRange(session.room, opening.wall).end - opening.width}
							value={opening.offset}
							oncommit={(value) => session.updateOpening(opening.id, { offset: value })}
						/>
						<NumberField
							label="폭"
							unit="cm"
							min={30}
							max={wallRange(session.room, opening.wall).end -
								wallRange(session.room, opening.wall).start}
							value={opening.width}
							oncommit={(value) => session.updateOpening(opening.id, { width: value })}
						/>
					</div>
					<Button
						size="sm"
						variant="danger"
						aria-label={`${name} 삭제`}
						onclick={() => session.removeOpening(opening.id)}
						><Icon name="trash" size={16} /> 삭제</Button
					>
				</fieldset>
			</li>
		{/each}
	</ul>
	<div class="actions">
		<Button size="sm" disabled={!session.canAddOpening} onclick={() => session.addOpening('door')}
			><Icon name="plus" size={16} /> 문</Button
		>
		<Button size="sm" disabled={!session.canAddOpening} onclick={() => session.addOpening('window')}
			><Icon name="plus" size={16} /> 창문</Button
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

	h3 {
		font-size: 0.8125rem;
		color: var(--ink-2);
	}

	.empty {
		font-size: 0.875rem;
		color: var(--ink-2);
	}

	ul {
		display: grid;
		gap: 0.75rem;
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

	legend {
		padding: 0 0.25rem;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem;
		width: 100%;
	}

	.actions {
		display: flex;
		gap: 0.375rem;
	}
</style>
