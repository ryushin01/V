<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import PlanItem from './PlanItem.svelte';

	let props: ComponentProps<typeof PlanItem> = $props();
</script>

<!-- PlanItem은 SVG 조각이므로 스토리와 테스트에서 svg로 감쌉니다. -->
<svg viewBox="-20 -60 240 180" width="480" height="360" role="group" aria-label="배치도">
	<PlanItem {...props} />
</svg>
