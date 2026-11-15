<script lang="ts">
	// 제목·본문: Barlow Condensed(영문)·해바라기(한글), 치수: IBM Plex Mono(영문·숫자).
	// 해바라기는 화면에 쓰는 글자만 담은 파일(pnpm fonts로 만듦)을 먼저 받고, 나머지 글자 조각은 첫 화면 뒤에 붙입니다.
	import '@fontsource/barlow-condensed/400.css';
	import '@fontsource/barlow-condensed/500.css';
	import '@fontsource/barlow-condensed/600.css';
	import '@fontsource/barlow-condensed/700.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '../app/styles/fonts/sunflower.css';
	import '../app/styles/global.css';
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { attachRestFonts } from '../app/lib/attachRestFonts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => attachRestFonts(asset('fonts/sunflower-rest.css')));
</script>

{@render children()}
