<script lang="ts">
	import { Button, Icon } from '#shared/ui';
	import { xray } from '../model/xray.svelte';
</script>

<Button
	size="sm"
	aria-pressed={xray.on}
	title="도면 아래의 치수와 케이블 보기"
	onclick={() => xray.toggle()}
>
	<Icon name="layers" size={16} /> <span lang="en">X-ray</span>
</Button>
