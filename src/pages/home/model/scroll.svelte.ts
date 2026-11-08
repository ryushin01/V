/** 페이지 스크롤 위치와 현재 구간을 한곳에서 읽습니다. */
export class ScrollTracker {
	y = $state(0);
	max = $state(0);
	viewport = $state(0);
	section = $state('소개');

	readonly progress = $derived(this.max > 0 ? Math.min(1, Math.max(0, this.y / this.max)) : 0);
	readonly percent = $derived(String(Math.round(this.progress * 100)).padStart(3, '0'));

	#update = () => {
		this.y = window.scrollY;
		this.viewport = window.innerHeight;
		this.max = document.documentElement.scrollHeight - window.innerHeight;
		const line = window.innerHeight * 0.4;
		let current = this.section;
		for (const element of document.querySelectorAll<HTMLElement>('[data-section]')) {
			if (element.getBoundingClientRect().top <= line) current = element.dataset.section ?? current;
		}
		this.section = current;
	};

	/** 등록을 해제하는 함수를 돌려줍니다. */
	start(): () => void {
		this.#update();
		window.addEventListener('scroll', this.#update, { passive: true });
		window.addEventListener('resize', this.#update);
		const observer = new ResizeObserver(this.#update);
		observer.observe(document.body);
		return () => {
			window.removeEventListener('scroll', this.#update);
			window.removeEventListener('resize', this.#update);
			observer.disconnect();
		};
	}

	scrollToProgress(ratio: number, immediate: boolean) {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({
			top: Math.min(1, Math.max(0, ratio)) * this.max,
			behavior: immediate || reduced ? 'auto' : 'smooth'
		});
	}
}
