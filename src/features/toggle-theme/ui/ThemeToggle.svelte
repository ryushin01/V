<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Icon } from '#shared/ui';

	let dark = $state(false);

	onMount(() => {
		const explicit = document.documentElement.dataset.theme;
		dark = explicit ? explicit === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
	});

	function toggle() {
		dark = !dark;
		const theme = dark ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('v-theme', theme);
		} catch {
			// 저장을 막은 브라우저에서도 현재 화면의 테마는 바뀝니다.
		}
	}
</script>

<Button size="sm" aria-pressed={dark} aria-label="다크 테마" title="다크 테마" onclick={toggle}>
	<Icon name={dark ? 'moon' : 'sun'} />
</Button>
