<script lang="ts">
	// 스토리와 테스트에서 쓰는 예시입니다. 옵션은 snippet으로 넘기므로 실제 사용처와 같은 모양으로 둡니다.
	import Select from './Select.svelte';

	let { value = $bindable('east'), onchange }: { value?: string; onchange?: () => void } = $props();
</script>

<Select label="벽" bind:value {onchange}>
	<option value="north">위쪽 벽</option>
	<option value="east">오른쪽 벽</option>
	<option value="south">아래쪽 벽</option>
</Select>
<p data-testid="value">{value}</p>
