/** 페이지 스크롤 위치와 현재 구간을 한곳에서 읽습니다. */
export class ScrollTracker {
	y = $state(0);
	max = $state(0);
	viewport = $state(0);
	section = $state('소개');

	readonly progress = $derived(this.max > 0 ? Math.min(1, Math.max(0, this.y / this.max)) : 0);
	readonly percent = $derived(String(Math.round(this.progress * 100)).padStart(3, '0'));

	/** 구간 요소는 시작할 때 한 번만 찾습니다(첫 화면의 구간은 바뀌지 않음). */
	#sections: HTMLElement[] = [];
	#frame = 0;

	#update = () => {
		this.#frame = 0;
		this.y = window.scrollY;
		this.viewport = window.innerHeight;
		this.max = document.documentElement.scrollHeight - window.innerHeight;
		const line = window.innerHeight * 0.4;
		let current = this.section;
		for (const element of this.#sections) {
			if (element.getBoundingClientRect().top <= line) current = element.dataset.section ?? current;
		}
		this.section = current;
	};

	/** 스크롤 이벤트가 한 프레임에 여러 번 와도 위치는 한 번만 읽습니다. */
	#schedule = () => {
		if (!this.#frame) this.#frame = requestAnimationFrame(this.#update);
	};

	/** 등록을 해제하는 함수를 돌려줍니다. */
	start(): () => void {
		this.#sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
		this.#update();
		window.addEventListener('scroll', this.#schedule, { passive: true });
		window.addEventListener('resize', this.#schedule);
		const observer = new ResizeObserver(this.#schedule);
		observer.observe(document.body);
		return () => {
			cancelAnimationFrame(this.#frame);
			this.#frame = 0;
			window.removeEventListener('scroll', this.#schedule);
			window.removeEventListener('resize', this.#schedule);
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
