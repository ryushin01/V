<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends Omit<HTMLSelectAttributes, 'value' | 'children'> {
		label: string;
		value?: string;
		id?: string;
		children: Snippet;
	}

	const uid = $props.id();
	let { label, value = $bindable(), id = uid, children, ...rest }: Props = $props();
</script>

<div class="field">
	<label for={id}>{label}</label>
	<div class="control">
		<select {id} bind:value {...rest}>
			{@render children()}
		</select>
		<!-- 브라우저 기본 화살표는 위치를 맞출 수 없어 직접 그립니다. 꾸밈이라 보조기술과 포인터에서 뺍니다. -->
		<span class="arrow" aria-hidden="true"><Icon name="down" size={16} /></span>
	</div>
</div>

<style>
	.field {
		/* 화살표 오른쪽 간격을 왼쪽(테두리 + 안쪽 여백)과 같게 맞추는 기준값입니다. */
		--select-border: 1px;
		--select-pad: 0.625rem;
		--select-icon: 1rem;
		display: grid;
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

	select {
		appearance: none;
		width: 100%;
		min-height: 2.5rem;
		padding: 0 calc(var(--select-pad) + var(--select-icon) + 0.375rem) 0 var(--select-pad);
		border: var(--select-border) solid var(--control);
		border-radius: var(--radius-field);
		font-size: 0.875rem;
		color: var(--ink);
		background: var(--paper);
		cursor: pointer;
	}

	.arrow {
		position: absolute;
		top: 50%;
		right: calc(var(--select-border) + var(--select-pad));
		display: flex;
		width: var(--select-icon);
		height: var(--select-icon);
		color: var(--ink-2);
		transform: translateY(-50%);
		pointer-events: none;
	}
</style>
