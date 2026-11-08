<script lang="ts">
	import { page } from '$app/state';
	import { EditorPage } from '#pages/editor';
</script>

{#key page.params.id}
	<EditorPage id={page.params.id ?? ''} />
{/key}
