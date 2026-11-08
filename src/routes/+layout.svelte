<script lang="ts">
	import '@fontsource-variable/bricolage-grotesque/wght.css';
	import '@fontsource-variable/space-grotesk/wght.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '../app/styles/global.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
