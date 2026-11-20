<script lang="ts">
	/**
	 * 홈 인트로. 잉크색 카드 윗변의 흰 역정삼각형 홈에 V 로고를 얹고, 삼각형이 커지며 카드가 갈라져
	 * 아래의 홈 화면이 드러납니다(약 2초). 움직임은 CSS만으로 돌고, 이 컴포넌트는 정리와 건너뛰기만 맡습니다.
	 *
	 * 재생 여부는 첫 페인트 전에 `src/app.html`의 인라인 스크립트가 정해 `<html data-intro="play">`로 알립니다.
	 * 탭에서 처음 홈(/)에 들어올 때 한 번(sessionStorage `v-intro`)이고, 주소에 #이 있거나 동작 줄이기를 켰으면
	 * 재생하지 않습니다. 미리 그린 HTML에 덮개가 들어 있어 홈이 잠깐 비쳤다가 가려지는 일이 없습니다.
	 * 덮개는 장식이라 `aria-hidden`이고 초점을 받지 않으며, 아무 키나 누르거나 화면을 누르면 바로 걷힙니다.
	 * 건너뛰기 처리기를 붙이면 `data-ready`를 달아, E2E가 수화가 끝났는지 알 수 있게 합니다.
	 */
	import { onMount } from 'svelte';

	/** 건너뛸 때 덮개가 걷히는 시간(ms). */
	const LEAVE_MS = 160;
	/** CSS 애니메이션이 어떤 이유로든 끝나지 않을 때 덮개를 걷는 시간(ms). 재생 시간(2초)보다 넉넉하게 둡니다. */
	const FAILSAFE_MS = 4000;

	let playing = $state(true);
	let leaving = $state(false);
	let ready = $state(false);
	let root = $state<HTMLDivElement>();

	onMount(() => {
		const html = document.documentElement;
		if (html.dataset.intro !== 'play' || !root) {
			playing = false;
			return;
		}

		let done = false;
		const timers: number[] = [];
		const finish = () => {
			if (done) return;
			done = true;
			delete html.dataset.intro;
			playing = false;
		};
		const skip = () => {
			if (done || leaving) return;
			leaving = true;
			timers.push(window.setTimeout(finish, LEAVE_MS));
		};

		window.addEventListener('keydown', skip);
		window.addEventListener('click', skip);
		ready = true;
		// 수화(hydration) 전에 이미 끝났다면 finished가 바로 풀려 곧장 정리됩니다.
		const animations = root.getAnimations?.({ subtree: true }) ?? [];
		Promise.all(animations.map((animation) => animation.finished)).then(finish, finish);
		timers.push(window.setTimeout(finish, FAILSAFE_MS));

		return () => {
			window.removeEventListener('keydown', skip);
			window.removeEventListener('click', skip);
			for (const timer of timers) window.clearTimeout(timer);
			// 재생 중에 화면을 떠나도 다시 돌아왔을 때 재생하지 않게 표시를 지웁니다.
			done = true;
			delete html.dataset.intro;
		};
	});
</script>

{#if playing}
	<div
		bind:this={root}
		class="intro"
		class:is-leaving={leaving}
		aria-hidden="true"
		data-testid="home-intro"
		data-ready={ready ? '' : undefined}
	>
		<div class="intro__tri"></div>
		<div class="intro__card"></div>
	</div>
{/if}

<style>
	/* 역정삼각형 한 변의 절반(a). 높이는 √3·a이고, 이 값 하나만 움직여 삼각형·홈·로고를 함께 키웁니다. */
	@property --intro-a {
		syntax: '<length>';
		inherits: true;
		initial-value: 0px;
	}

	.intro {
		/* 카드 둘레 여백과 모서리 */
		--m: clamp(8px, 1.2vmin, 16px);
		--rad: clamp(16px, 2.4vmin, 28px);
		/* 처음 크기와 다 열린 크기: 두 변이 카드 아래 모서리 바깥으로 지나갈 만큼(a ≥ 폭/2 + 높이/√3) */
		--a0: clamp(90px, 17vmin, 180px);
		--a1: calc(50vw + 58vh + 4rem);
		/* 삼각형은 테마와 관계없이 흰색, 로고는 검정입니다. */
		--white: var(--paper);
		--card: var(--ink);
		--open-at: 1150ms;
		display: none;
		position: fixed;
		inset: 0;
		z-index: 1000;
		animation:
			intro-open 820ms cubic-bezier(0.7, 0, 0.2, 1) var(--open-at) both,
			intro-end 1ms linear 2000ms forwards;
	}

	/* 첫 페인트 전 판단(app.html)이 재생으로 정했을 때만 보입니다. 동작 줄이기를 켰거나 인쇄할 때는 보이지 않습니다. */
	@media screen and (prefers-reduced-motion: no-preference) {
		:global(:root[data-intro='play']) .intro {
			display: block;
		}
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .intro {
			--white: var(--ink);
			--card: color-mix(in oklab, var(--ink) 8%, var(--paper));
		}
	}

	:global(:root[data-theme='dark']) .intro {
		--white: var(--ink);
		--card: color-mix(in oklab, var(--ink) 8%, var(--paper));
	}

	.intro.is-leaving {
		opacity: 0;
		pointer-events: none;
		transition: opacity 160ms ease-out;
	}

	/* 페이지 바탕. 카드 둘레 여백이고, 삼각형이 커지는 동안 걷혀 홈 화면이 비칩니다. */
	.intro::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--paper);
		animation: intro-fade 450ms ease-out 1300ms both;
	}

	.intro__tri,
	.intro__card {
		--a: var(--intro-a);
		--d: calc(var(--a) * 1.7321);
		--f: calc(var(--a) * 0.14);
		--r: calc(var(--a) * 0.12);
		position: absolute;
		inset: var(--m);
	}

	/* 흰 삼각형. 카드 구멍보다 1.5px 크게 그려 경계에 틈이 보이지 않게 하고, 커지기 시작하면 로고와 함께 걷힙니다. */
	.intro__tri {
		--a: calc(var(--intro-a) + 1.5px);
		background: var(--white);
		clip-path: polygon(calc(50% - var(--a)) 0, calc(50% + var(--a)) 0, 50% var(--d));
		animation: intro-fade 320ms ease-in var(--open-at) both;
	}

	/*
	 * 로고는 삼각형 무게중심(윗변에서 높이의 1/3)에 두고 삼각형과 같은 값으로 함께 커집니다.
	 * 배경 그림이라 크기·위치가 바뀌어도 칠하기만 다시 하고 레이아웃은 그대로입니다(CLS 0).
	 */
	.intro__tri::after {
		content: '';
		position: absolute;
		inset: 0;
		background: url('/brand/logo-512.png') no-repeat;
		background-size: calc(var(--intro-a) * 0.9);
		background-position: 50% calc(var(--intro-a) * 0.1274);
		transform-origin: 50% calc(var(--a0) * 0.5774);
		animation: intro-mark-in 450ms var(--ease) 80ms both;
	}

	.intro__card {
		border-radius: var(--rad);
		background: var(--card);
		clip-path: polygon(
			0 0,
			calc(50% - var(--a)) 0,
			50% var(--d),
			calc(50% + var(--a)) 0,
			100% 0,
			100% 100%,
			0 100%
		);
	}

	/* shape()를 아는 브라우저는 어깨와 꼭짓점을 둥글게 깎습니다(0.5, 0.866 = 60° 변의 방향). */
	@supports (clip-path: shape(from 0 0, line to 1px 1px)) {
		.intro__tri {
			clip-path: shape(
				from calc(50% - var(--a) - var(--f)) 0,
				curve to calc(50% - var(--a) + var(--f) * 0.5) calc(var(--f) * 0.866) with
					calc(50% - var(--a)) 0,
				line to calc(50% - var(--r) * 0.5) calc(var(--d) - var(--r) * 0.866),
				curve to calc(50% + var(--r) * 0.5) calc(var(--d) - var(--r) * 0.866) with 50% var(--d),
				line to calc(50% + var(--a) - var(--f) * 0.5) calc(var(--f) * 0.866),
				curve to calc(50% + var(--a) + var(--f)) 0 with calc(50% + var(--a)) 0,
				close
			);
		}

		.intro__card {
			clip-path: shape(
				from 0 0,
				line to calc(50% - var(--a) - var(--f)) 0,
				curve to calc(50% - var(--a) + var(--f) * 0.5) calc(var(--f) * 0.866) with
					calc(50% - var(--a)) 0,
				line to calc(50% - var(--r) * 0.5) calc(var(--d) - var(--r) * 0.866),
				curve to calc(50% + var(--r) * 0.5) calc(var(--d) - var(--r) * 0.866) with 50% var(--d),
				line to calc(50% + var(--a) - var(--f) * 0.5) calc(var(--f) * 0.866),
				curve to calc(50% + var(--a) + var(--f)) 0 with calc(50% + var(--a)) 0,
				line to 100% 0,
				line to 100% 100%,
				line to 0 100%,
				close
			);
		}
	}

	@keyframes intro-open {
		from {
			--intro-a: var(--a0);
		}

		to {
			--intro-a: var(--a1);
		}
	}

	@keyframes intro-fade {
		to {
			opacity: 0;
		}
	}

	@keyframes intro-mark-in {
		from {
			opacity: 0;
			scale: 0.94;
		}
	}

	@keyframes intro-end {
		to {
			visibility: hidden;
		}
	}
</style>
