<script lang="ts">
	// 제목: Roboto Condensed(영문)·해바라기(한글), 치수: IBM Plex Mono(영문·숫자).
	// 본문과 치수 속 한글은 운영체제 고딕입니다. 편집기는 목록·안내 문구가 많아 한글 웹 글꼴이 조각을 많이 받게 하기 때문입니다.
	import '@fontsource-variable/roboto-condensed/wght.css';
	import '@fontsource/sunflower/500.css';
	import '@fontsource/sunflower/700.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '../app/styles/global.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
