<script lang="ts">
	import FloorPlan from './FloorPlan.svelte';
	import type { EditorSession } from '../model/session.svelte';

	let { session }: { session: EditorSession } = $props();
</script>

<!-- 스토리에서 편집 화면과 같은 높이를 주는 틀입니다. -->
<div style="height: 100vh"><FloorPlan {session} /></div>
