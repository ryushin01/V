<script lang="ts">
	import { SITE } from '#shared/config';

	interface Props {
		title: string;
		description?: string;
		/** 운영 주소 기준 경로. canonical과 공유 미리보기 주소에 씁니다. */
		path?: string;
		/** 검색에 넣지 않을 화면(편집, 오류)입니다. canonical을 넣지 않습니다. */
		noindex?: boolean;
	}

	let { title, description = SITE.description, path = '/', noindex = false }: Props = $props();

	const url = $derived(new URL(path, SITE.url).href);
	const image = new URL(SITE.image.path, SITE.url).href;
</script>

<!-- 화면 제목과 검색·공유 미리보기(OG·트위터) 정보입니다. 화면에는 아무것도 그리지 않습니다. -->
<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<link rel="canonical" href={url} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:locale" content="ko_KR" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content={String(SITE.image.width)} />
	<meta property="og:image:height" content={String(SITE.image.height)} />
	<meta property="og:image:alt" content={SITE.image.alt} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
