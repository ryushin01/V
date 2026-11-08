import type { Attachment } from 'svelte/attachments';

/** 화면에 들어올 때 나타나게 합니다. 동작 줄이기를 켠 사용자에게는 처음부터 보입니다. */
export const reveal: Attachment<HTMLElement> = (node) => {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	node.dataset.reveal = 'pending';
	const observer = new IntersectionObserver(
		(entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			node.dataset.reveal = 'done';
			observer.disconnect();
		},
		{ rootMargin: '0px 0px -8% 0px' }
	);
	observer.observe(node);
	return () => observer.disconnect();
};
