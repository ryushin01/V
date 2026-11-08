<script lang="ts" module>
	const PATHS = {
		plus: 'M12 5v14M5 12h14',
		minus: 'M5 12h14',
		undo: 'M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12',
		redo: 'M15 7l5 5-5 5M20 12H10a6 6 0 0 0 0 12',
		rotateLeft: 'M4 5v6h6M4.6 11A8 8 0 1 1 6 17',
		rotateRight: 'M20 5v6h-6M19.4 11A8 8 0 1 0 18 17',
		trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
		copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
		download: 'M12 4v11M7 11l5 5 5-5M4 20h16',
		upload: 'M12 16V5M7 9l5-5 5 5M4 20h16',
		check: 'M5 12.5 10 18l9-11',
		alert: 'M12 4 2.5 20h19zM12 10v5M12 17.5v.5',
		stop: 'M8 3h8l5 5v8l-5 5H8l-5-5V8zM8.5 8.5l7 7M15.5 8.5l-7 7',
		fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
		left: 'M15 5l-7 7 7 7',
		right: 'M9 5l7 7-7 7',
		up: 'M5 15l7-7 7 7',
		down: 'M5 9l7 7 7-7',
		sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
		moon: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10',
		keyboard: 'M3 7h18v11H3zM7 11h.5M11 11h.5M15 11h.5M8 15h8',
		arrow: 'M6 18 18 6M9 6h9v9',
		share: 'M12 15V4M8 8l4-4 4 4M5 12v8h14v-8',
		layers: 'M12 3 3 8l9 5 9-5zM3 13l9 5 9-5'
	} as const;

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 18 }: { name: IconName; size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	focusable="false"><path d={PATHS[name]} /></svg
>
