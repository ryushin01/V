/**
 * 실제 제품을 위에서 본 모습을 선으로 그립니다.
 * 좌표는 물건 가운데가 (0, 0)인 cm 단위이고, 회전 0도에서 화면과 키보드는 아래쪽(+y)을 향합니다.
 * 치수를 바꿔도 비율이 맞도록 가로(w)·세로(d)에 대한 비율로 그립니다. 제조사 로고는 그리지 않습니다.
 */
export type GlyphId =
	| 'odyssey-g9'
	| 'ultragear-45'
	| 'alienware-34'
	| 'ultragear-27'
	| 'studio-display'
	| 'imac-24'
	| 'oled-c4'
	| 's90d'
	| 'bravia-8'
	| 'ps5-pro'
	| 'ps5-slim'
	| 'xbox-series-x'
	| 'xbox-series-s'
	| 'switch-2-dock'
	| 'mac-mini'
	| 'mac-studio'
	| 'macbook'
	| 'o11-evo'
	| 'h9-flow'
	| 'north'
	| 'torque'
	| 'uppspel'
	| 'magnus-pro'
	| 'besta'
	| 'aeron'
	| 'arc-ultra'
	| 'sub-4'
	| 'q990d'
	| 'q990d-sub'
	| 'avr';

export interface Shape {
	tag: 'path' | 'rect' | 'circle' | 'ellipse' | 'line';
	attrs: Record<string, number | string>;
	/** body: 바탕을 칠한 면, solid: 짙게 칠한 면, dot: 작은 점 */
	cls?: 'body' | 'solid' | 'dot' | 'faint';
}

const rect = (
	x: number,
	y: number,
	width: number,
	height: number,
	rx = 0,
	cls?: Shape['cls']
): Shape => ({
	tag: 'rect',
	attrs: { x, y, width, height, rx },
	cls
});
const circle = (cx: number, cy: number, r: number, cls?: Shape['cls']): Shape => ({
	tag: 'circle',
	attrs: { cx, cy, r },
	cls
});
const path = (d: string, cls?: Shape['cls']): Shape => ({ tag: 'path', attrs: { d }, cls });
const line = (x1: number, y1: number, x2: number, y2: number, cls?: Shape['cls']): Shape => ({
	tag: 'line',
	attrs: { x1, y1, x2, y2 },
	cls
});

/** 사각 영역 안에 일정한 간격의 점을 찍습니다. 통풍구와 스피커 그릴에 씁니다. */
function dots(
	x: number,
	y: number,
	width: number,
	height: number,
	gap: number,
	r: number
): Shape[] {
	const result: Shape[] = [];
	const columns = Math.max(1, Math.floor(width / gap));
	const rows = Math.max(1, Math.floor(height / gap));
	for (let row = 0; row < rows; row += 1) {
		for (let column = 0; column < columns; column += 1) {
			const offset = row % 2 === 0 ? 0 : gap / 2;
			const cx = x + gap / 2 + column * gap + offset;
			if (cx > x + width) continue;
			result.push(circle(cx, y + gap / 2 + row * gap, r, 'dot'));
		}
	}
	return result;
}

/** 원 안에만 점을 찍습니다. Xbox의 원형 통풍구에 씁니다. */
function dotsInCircle(cx: number, cy: number, radius: number, gap: number, r: number): Shape[] {
	return dots(cx - radius, cy - radius, radius * 2, radius * 2, gap, r).filter((shape) => {
		const dx = Number(shape.attrs.cx) - cx;
		const dy = Number(shape.attrs.cy) - cy;
		return Math.hypot(dx, dy) <= radius - r;
	});
}

/** 곡면 화면. 양 끝이 사용자 쪽으로 다가오도록 휘어집니다. */
function curvedPanel(
	w: number,
	d: number,
	radius: number,
	thickness: number
): { shapes: Shape[]; back: number } {
	const half = w / 2;
	const front = d / 2 - 1;
	const sagitta = Math.min(
		d - thickness - 2,
		radius - Math.sqrt(Math.max(0, radius ** 2 - half ** 2))
	);
	const r = (half ** 2 + sagitta ** 2) / (2 * Math.max(sagitta, 0.01));
	const back = front - sagitta - thickness;
	return {
		back,
		shapes: [
			path(
				`M${-half} ${front}A${r} ${r} 0 0 1 ${half} ${front}L${half} ${front - thickness}A${r} ${r} 0 0 0 ${-half} ${front - thickness}Z`,
				'body'
			),
			path(
				`M${-half * 0.98} ${front - thickness * 0.35}A${r} ${r} 0 0 1 ${half * 0.98} ${front - thickness * 0.35}`,
				'faint'
			)
		]
	};
}

/** 평면 화면. 얇은 패널이 앞쪽에 서 있습니다. */
function flatPanel(w: number, d: number, y: number, thickness: number): Shape {
	return rect(-w / 2, y, w, thickness, 0.6, 'body');
}

type Draw = (w: number, d: number) => Shape[];

export const MODEL_GLYPHS: Record<GlyphId, Draw> = {
	// 1000R 곡면과 가운데 목, 좁은 받침
	'odyssey-g9': (w, d) => {
		const panel = curvedPanel(w, d, 100, 2.6);
		return [
			rect(-w * 0.12, -d / 2 + 0.5, w * 0.24, d * 0.55, 2.5, 'body'),
			rect(-w * 0.03, panel.back - 1, w * 0.06, 4, 1),
			...panel.shapes
		];
	},
	// 800R 곡면과 넓은 사각 받침
	'ultragear-45': (w, d) => {
		const panel = curvedPanel(w, d, 80, 3);
		return [
			rect(-w * 0.2, -d / 2 + 0.5, w * 0.4, d * 0.62, 3, 'body'),
			rect(-w * 0.04, panel.back - 2, w * 0.08, 5, 1),
			...panel.shapes
		];
	},
	// 1800R 곡면과 뒤로 벌어진 두 다리
	'alienware-34': (w, d) => {
		const panel = curvedPanel(w, d, 180, 3.2);
		const neck = panel.back - 1;
		return [
			path(`M0 ${neck}L${-w * 0.2} ${-d / 2 + 1.5}M0 ${neck}L${w * 0.2} ${-d / 2 + 1.5}`),
			circle(-w * 0.2, -d / 2 + 1.5, 1.4, 'solid'),
			circle(w * 0.2, -d / 2 + 1.5, 1.4, 'solid'),
			rect(-w * 0.035, neck - 4, w * 0.07, 6, 1.5, 'body'),
			...panel.shapes
		];
	},
	// 평면 화면과 납작한 받침
	'ultragear-27': (w, d) => [
		rect(-w * 0.22, -d / 2 + 0.5, w * 0.44, d * 0.7, 3, 'body'),
		rect(-w * 0.04, d / 2 - 7, w * 0.08, 4, 1),
		flatPanel(w, d, d / 2 - 3.5, 3)
	],
	// 알루미늄 판 받침과 얇은 화면
	'studio-display': (w, d) => [
		rect(-w * 0.14, -d / 2 + 0.5, w * 0.28, d - 2, 2, 'body'),
		line(0, -d / 2 + 2, 0, d / 2 - 3),
		flatPanel(w, d, d / 2 - 2.5, 2)
	],
	'imac-24': (w, d) => [
		rect(-w * 0.12, -d / 2 + 0.5, w * 0.24, d - 2, 2, 'body'),
		line(0, -d / 2 + 2, 0, d / 2 - 3),
		flatPanel(w, d, d / 2 - 2.5, 1.5)
	],
	// 가운데 받침대 위의 얇은 패널
	'oled-c4': (w, d) => [
		rect(-w * 0.19, -d * 0.42, w * 0.38, d * 0.84, 4, 'body'),
		flatPanel(w, d, -d * 0.05, 1.8),
		line(-w * 0.19, d * 0.25, w * 0.19, d * 0.25, 'faint')
	],
	s90d: (w, d) => [
		path(`M${-w * 0.12} ${-d * 0.42}H${w * 0.12}L${w * 0.17} ${d * 0.42}H${-w * 0.17}Z`, 'body'),
		flatPanel(w, d, -d * 0.04, 1.6)
	],
	// 양 끝의 날 모양 다리
	'bravia-8': (w, d) => [
		rect(-w * 0.44, -d * 0.46, 3.5, d * 0.92, 1.5, 'solid'),
		rect(w * 0.44 - 3.5, -d * 0.46, 3.5, d * 0.92, 1.5, 'solid'),
		flatPanel(w, d, -d * 0.05, 2.4)
	],
	// 흰 덮개와 가운데의 검은 띠, 세 줄 통풍구
	'ps5-pro': (w, d) => [
		path(
			`M${-w / 2 + 3} ${-d / 2}H${w / 2 - 3}Q${w / 2} ${-d / 2} ${w / 2} ${-d / 2 + 3}V${d / 2 - 3}Q${w / 2} ${d / 2} ${w / 2 - 3} ${d / 2}H${-w / 2 + 3}Q${-w / 2} ${d / 2} ${-w / 2} ${d / 2 - 3}V${-d / 2 + 3}Q${-w / 2} ${-d / 2} ${-w / 2 + 3} ${-d / 2}Z`,
			'body'
		),
		rect(-w * 0.47, -d * 0.11, w * 0.94, d * 0.22, 1, 'solid'),
		...[-0.06, 0, 0.06].map((ratio) => line(-w * 0.4, d * ratio, w * 0.4, d * ratio, 'faint'))
	],
	// 위 덮개가 둘로 나뉘고 가운데에 검은 띠
	'ps5-slim': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 3, 'body'),
		rect(-w * 0.48, -d * 0.06, w * 0.96, d * 0.12, 0.8, 'solid'),
		line(-w * 0.12, -d / 2 + 1, -w * 0.12, -d * 0.06),
		line(-w * 0.12, d * 0.06, -w * 0.12, d / 2 - 1)
	],
	// 세워 둔 정육면체 위의 원형 통풍구
	'xbox-series-x': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		circle(0, 0, Math.min(w, d) * 0.4, 'solid'),
		...dotsInCircle(0, 0, Math.min(w, d) * 0.38, 1.3, 0.35)
	],
	// 한쪽의 큰 원형 통풍구
	'xbox-series-s': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		circle(w * 0.24, 0, d * 0.4, 'solid'),
		...dotsInCircle(w * 0.24, 0, d * 0.38, 1.2, 0.3)
	],
	// 본체를 꽂는 홈
	'switch-2-dock': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		rect(-w * 0.42, -d * 0.12, w * 0.84, d * 0.24, 0.8, 'solid')
	],
	'mac-mini': (w, d) => [
		rect(-w / 2, -d / 2, w, d, w * 0.17, 'body'),
		rect(-w * 0.42, -d * 0.42, w * 0.84, d * 0.84, w * 0.14, 'faint')
	],
	// 둥근 모서리와 뒷면 통풍구
	'mac-studio': (w, d) => [
		rect(-w / 2, -d / 2, w, d, w * 0.12, 'body'),
		...dots(-w * 0.4, -d / 2 + 0.6, w * 0.8, 2, 0.9, 0.2)
	],
	// 뒤쪽 경첩, 키보드, 트랙패드
	macbook: (w, d) => {
		const keys: Shape[] = [];
		for (let row = 0; row < 5; row += 1) {
			keys.push(
				line(-w * 0.4, -d * 0.3 + row * d * 0.07, w * 0.4, -d * 0.3 + row * d * 0.07, 'faint')
			);
		}
		return [
			rect(-w / 2, -d / 2, w, d, 1.2, 'body'),
			rect(-w * 0.44, -d / 2, w * 0.88, 1.2, 0.4, 'solid'),
			rect(-w * 0.42, -d * 0.34, w * 0.84, d * 0.36, 0.8),
			...keys,
			rect(-w * 0.2, d * 0.1, w * 0.4, d * 0.32, 0.8)
		];
	},
	// 두 공간으로 나뉜 본체와 기둥 없는 앞 모서리
	'o11-evo': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		line(w * 0.16, -d / 2, w * 0.16, d / 2),
		...dots(-w * 0.45, -d * 0.45, w * 0.58, d * 0.5, 2.2, 0.35),
		path(`M${-w / 2} ${d / 2 - 4}L${-w / 2 + 4} ${d / 2}`, 'faint')
	],
	'h9-flow': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		line(w * 0.18, -d / 2, w * 0.18, d / 2),
		...dots(-w * 0.46, -d * 0.46, w * 0.6, d * 0.92, 2.2, 0.35)
	],
	// 앞면의 세로 나무 살과 위쪽 통풍망
	north: (w, d) => {
		const slats: Shape[] = [];
		for (let x = -w / 2 + 1.5; x < w / 2 - 1; x += 1.6)
			slats.push(line(x, d / 2 - 3, x, d / 2 - 0.3));
		return [
			rect(-w / 2, -d / 2, w, d, 1, 'body'),
			rect(-w / 2, d / 2 - 3.2, w, 3.2, 0.5),
			...slats,
			...dots(-w * 0.4, -d * 0.42, w * 0.8, d * 0.7, 2.4, 0.35)
		];
	},
	// 열린 프레임: 양쪽 레일과 가운데 메인보드 판
	torque: (w, d) => [
		path(`M${-w / 2} ${-d / 2}L${w / 2} ${-d / 2}L${w / 2} ${d / 2}L${-w / 2} ${d / 2}Z`, 'faint'),
		rect(-w / 2, -d / 2, 3, d, 1, 'solid'),
		rect(w / 2 - 3, -d / 2, 3, d, 1, 'solid'),
		path(
			`M${-w / 2 + 3} ${-d * 0.3}L${w / 2 - 3} ${-d * 0.1}M${-w / 2 + 3} ${d * 0.3}L${w / 2 - 3} ${d * 0.1}`
		),
		rect(-w * 0.28, -d * 0.18, w * 0.56, d * 0.36, 0.8, 'body')
	],
	// 뒤쪽 케이블 구멍 두 개
	uppspel: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		rect(-w / 2 + 4, -d / 2 + 4, w - 8, d - 8, 1, 'faint'),
		rect(-w * 0.32, -d / 2 + 3, 12, 4, 2),
		rect(w * 0.32 - 12, -d / 2 + 3, 12, 4, 2)
	],
	// 뒤쪽의 경첩식 케이블 덮개
	'magnus-pro': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		rect(-w / 2 + 1, -d / 2 + 1, w - 2, d * 0.14, 0.6),
		...[-0.3, -0.1, 0.1, 0.3].map((ratio) =>
			line(w * ratio - 3, -d / 2 + 1 + d * 0.14, w * ratio + 3, -d / 2 + 1 + d * 0.14, 'solid')
		)
	],
	// 세 칸으로 나뉜 장
	besta: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.6, 'body'),
		line(-w / 6, -d / 2, -w / 6, d / 2, 'faint'),
		line(w / 6, -d / 2, w / 6, d / 2, 'faint'),
		line(-w / 2, d / 2 - 2, w / 2, d / 2 - 2)
	],
	// 다섯 갈래 다리, 앞이 넓은 망사 좌석, 뒤로 휜 등받이
	aeron: (w, d) => {
		const legs: Shape[] = [];
		const radius = Math.min(w, d) * 0.46;
		for (let index = 0; index < 5; index += 1) {
			const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			legs.push(line(0, 0, x, y), circle(x, y, 2.2, 'solid'));
		}
		return [
			...legs,
			path(
				`M${-w * 0.27} ${-d * 0.3}H${w * 0.27}Q${w * 0.32} ${-d * 0.3} ${w * 0.31} ${-d * 0.2}L${w * 0.25} ${d * 0.2}H${-w * 0.25}L${-w * 0.31} ${-d * 0.2}Q${-w * 0.32} ${-d * 0.3} ${-w * 0.27} ${-d * 0.3}Z`,
				'body'
			),
			...dots(-w * 0.22, -d * 0.25, w * 0.44, d * 0.4, 3, 0.35),
			path(`M${-w * 0.3} ${d * 0.28}Q0 ${d * 0.42} ${w * 0.3} ${d * 0.28}`),
			rect(-w * 0.42, -d * 0.12, 3, d * 0.28, 1.5, 'body'),
			rect(w * 0.42 - 3, -d * 0.12, 3, d * 0.28, 1.5, 'body')
		];
	},
	// 양 끝이 둥근 막대와 촘촘한 그릴
	'arc-ultra': (w, d) => [
		rect(-w / 2, -d / 2, w, d, d / 2, 'body'),
		...dots(-w / 2 + d / 2, -d / 2 + 0.8, w - d, d - 1.6, 1.4, 0.25)
	],
	// 가운데가 뚫린 서브우퍼
	'sub-4': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 3, 'body'),
		rect(-w * 0.32, -d * 0.18, w * 0.64, d * 0.36, d * 0.18, 'solid')
	],
	q990d: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		...dots(-w / 2 + 2, -d * 0.05, w - 4, d * 0.5, 1.6, 0.3)
	],
	'q990d-sub': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		circle(0, d * 0.05, w * 0.35),
		circle(0, d * 0.05, w * 0.12, 'solid')
	],
	// 앞면의 큰 음량 손잡이와 표시창
	avr: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		line(-w / 2, d / 2 - 2, w / 2, d / 2 - 2),
		circle(w * 0.32, d / 2 - 5.5, 3.2),
		circle(-w * 0.38, d / 2 - 4.5, 1.8),
		rect(-w * 0.18, d / 2 - 6, w * 0.36, 2.5, 0.4, 'solid'),
		...dots(-w * 0.4, -d * 0.42, w * 0.8, d * 0.45, 2.4, 0.35)
	]
};

export function drawModel(id: GlyphId, w: number, d: number): Shape[] {
	return MODEL_GLYPHS[id](w, d);
}
