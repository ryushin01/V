import { mount, tick, unmount } from 'svelte';
import type { PlanData } from '../model/types';
import PlanPreview from '../ui/PlanPreview.svelte';

/**
 * SVG를 그림(img)으로 그리면 문서의 CSS(클래스, CSS 변수)가 풀리지 않으므로, 화면에 그린 미리보기에서
 * 계산된 값을 요소마다 style 속성으로 옮깁니다. 글꼴은 그림 안에서 웹 글꼴을 받지 못해 운영체제 글꼴로 그립니다.
 */
const STYLE_PROPERTIES = [
	'display',
	'visibility',
	'opacity',
	'fill',
	'fill-opacity',
	'stroke',
	'stroke-opacity',
	'stroke-width',
	'stroke-dasharray',
	'stroke-linecap',
	'stroke-linejoin',
	'vector-effect',
	'paint-order',
	'font-family',
	'font-size',
	'font-weight',
	'text-anchor',
	'dominant-baseline'
] as const;

export function inlineStyles(source: Element, target: Element): void {
	const computed = getComputedStyle(source);
	const style = STYLE_PROPERTIES.map((name) => {
		const value = computed.getPropertyValue(name);
		return value ? `${name}:${value}` : '';
	})
		.filter(Boolean)
		.join(';');
	if (style) target.setAttribute('style', style);
	target.removeAttribute('class');
	for (let index = 0; index < source.children.length; index += 1) {
		const child = target.children[index];
		if (child) inlineStyles(source.children[index], child);
	}
}

/** 그림의 크기입니다. 1cm에 4px(2배 해상도)로 그리되, 긴 변이 4096px을 넘지 않게 줄입니다. */
export function planImageSize(plan: Pick<PlanData, 'room'>): {
	width: number;
	height: number;
	/** 화면에 그릴 때(1배)의 1cm당 픽셀 */
	pixelsPerCm: number;
	/** 그림 해상도 배율 */
	density: number;
} {
	const MAX_EDGE = 4096;
	const pixelsPerCm = 2;
	const width = (plan.room.width + 16) * pixelsPerCm;
	const height = (plan.room.depth + 16) * pixelsPerCm;
	const density = Math.min(2, MAX_EDGE / Math.max(width, height));
	return { width, height, pixelsPerCm, density };
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * 배치도를 지금 테마·X-ray 색 그대로 PNG로 만듭니다. 금액은 그림에 없습니다(미리보기에 그리지 않음).
 * 화면 밖에 미리보기를 잠깐 그려 계산된 스타일을 옮기고, 캔버스로 그림 파일을 만듭니다.
 */
export async function renderPlanImage(
	plan: PlanData,
	options: { xray: boolean; background: string }
): Promise<Blob> {
	const { width, height, density } = planImageSize(plan);
	const host = document.createElement('div');
	host.setAttribute('aria-hidden', 'true');
	host.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;height:${height}px;pointer-events:none;`;
	document.body.append(host);
	const preview = mount(PlanPreview, {
		target: host,
		props: { plan, xray: options.xray, names: true }
	});
	let url = '';
	try {
		// 크기에 맞춘 배율(글자 크기, X-ray 치수)이 반영되도록 두 번 그린 뒤 읽습니다.
		await tick();
		await nextFrame();
		await nextFrame();
		const source = host.querySelector('svg');
		if (!source) throw new Error('미리보기를 그리지 못했습니다.');
		const svg = source.cloneNode(true) as SVGSVGElement;
		inlineStyles(source, svg);
		svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
		svg.setAttribute('width', String(width));
		svg.setAttribute('height', String(height));
		const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		background.setAttribute('x', '-8');
		background.setAttribute('y', '-8');
		background.setAttribute('width', String(plan.room.width + 16));
		background.setAttribute('height', String(plan.room.depth + 16));
		background.setAttribute('fill', options.background);
		svg.prepend(background);

		url = URL.createObjectURL(
			new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
		);
		const image = new Image();
		image.src = url;
		await image.decode();
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(width * density);
		canvas.height = Math.round(height * density);
		const context = canvas.getContext('2d');
		if (!context) throw new Error('그림을 그릴 수 없습니다.');
		context.drawImage(image, 0, 0, canvas.width, canvas.height);
		return await new Promise<Blob>((resolve, reject) =>
			canvas.toBlob(
				(blob) => (blob ? resolve(blob) : reject(new Error('그림 파일을 만들지 못했습니다.'))),
				'image/png'
			)
		);
	} finally {
		if (url) URL.revokeObjectURL(url);
		unmount(preview);
		host.remove();
	}
}
