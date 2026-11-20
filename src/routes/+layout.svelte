<script lang="ts">
	// 쇼핑몰(My First Gear) HUD 개편과 같은 글꼴 조합입니다.
	// 큰 제목: Bodoni Moda(영문, 광학 크기 축)·본명조(Noto Serif KR), 본문: IBM Plex Sans KR,
	// 라벨·치수: IBM Plex Mono(영문·숫자)·나눔고딕코딩(한글).
	// 한글 글꼴은 화면에 쓰는 글자만 담은 파일(pnpm fonts로 만듦)을 먼저 받고, 나머지 글자 조각은 첫 화면 뒤에 붙입니다.
	import '@fontsource-variable/bodoni-moda/standard.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '@fontsource/ibm-plex-mono/500.css';
	import '../app/styles/fonts/noto-serif-kr.css';
	import '../app/styles/fonts/ibm-plex-sans-kr.css';
	import '../app/styles/fonts/nanum-gothic-coding.css';
	import '../app/styles/global.css';
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { attachRestFonts } from '../app/lib/attachRestFonts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		// 한글 글꼴마다 나머지 글자 조각 목록(pnpm fonts가 만든 <글꼴>-rest.css)을 붙입니다.
		const cancels = [
			attachRestFonts(asset('fonts/noto-serif-kr-rest.css')),
			attachRestFonts(asset('fonts/ibm-plex-sans-kr-rest.css')),
			attachRestFonts(asset('fonts/nanum-gothic-coding-rest.css'))
		];
		return () => cancels.forEach((cancel) => cancel());
	});
</script>

{@render children()}
