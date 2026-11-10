<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '#shared/ui';

	let { status }: { status: number } = $props();

	const notFound = $derived(status === 404);
</script>

<svelte:head>
	<title>{notFound ? '페이지를 찾을 수 없습니다' : '문제가 생겼습니다'} | V</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="page">
	<p class="measure">ERROR <b>{status}</b></p>
	<h1 class="display-1">
		{#if notFound}치수가<br />맞지 않습니다.{:else}잠시 뒤<br />다시 재 주세요.{/if}
	</h1>
	<p class="lead">
		{notFound
			? '주소가 바뀌었거나 없는 페이지입니다. 배치도는 이 브라우저에 그대로 있습니다.'
			: '화면을 그리는 중에 문제가 생겼습니다. 저장한 배치도는 지워지지 않습니다.'}
	</p>
	<Button variant="primary" arrow href={resolve('/')}>처음으로</Button>
</main>

<style>
	.page {
		display: grid;
		align-content: end;
		justify-items: start;
		gap: 1.5rem;
		min-height: 100svh;
		padding: var(--shell);
	}

	.measure b {
		font-weight: 400;
		color: var(--accent-deep);
	}

	.lead {
		max-width: 34rem;
		font-size: clamp(1.0625rem, 1.4vw, 1.3125rem);
		color: var(--ink-2);
	}
</style>
