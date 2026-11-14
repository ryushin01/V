<script lang="ts">
	/** V 로고(블랙레터 V). 이름은 감싼 링크의 aria-label이 제공하므로 그림은 장식입니다. 어두운 테마에서는 밝게 뒤집습니다. */
	let { size = 32 }: { size?: number } = $props();
</script>

<img
	class="brand-mark"
	src="/brand/logo.png"
	alt=""
	width={size}
	height={size}
	data-testid="brand-mark"
/>

<style>
	.brand-mark {
		display: block;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .brand-mark {
			filter: invert(1);
		}
	}

	:global(:root[data-theme='dark']) .brand-mark {
		filter: invert(1);
	}
</style>
