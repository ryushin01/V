<script lang="ts">
	import { page } from '$app/state';
	import { ErrorPage } from '#pages/error';
</script>

<ErrorPage status={page.status} />
