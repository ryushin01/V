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
	| 'avr'
	| 'mattz'
	| 'footrest'
	| 'footrest-wave'
	| 'dell-ultrasharp'
	| 'monitor-arm'
	| 'light-bar'
	| 'kb-96'
	| 'kb-tkl'
	| 'kb-75'
	| 'kb-65'
	| 'kb-60'
	| 'kb-hhkb'
	| 'kb-magic'
	| 'kb-phoenix'
	| 'palm-rest'
	| 'mouse-palm'
	| 'mouse-symmetric'
	| 'mouse-ergo'
	| 'mouse-magic'
	| 'mouse-vertical'
	| 'trackball'
	| 'mouse-dock'
	| 'powerplay'
	| 'mousepad'
	| 'katana'
	| 'katana-sub'
	| 'amp-knob'
	| 'dongle'
	| 'dac-portable'
	| 'dap'
	| 'radio'
	| 'headphones'
	| 'iem'
	| 'earbud-round'
	| 'earhook'
	| 'iem-bullet'
	| 'earbuds-case'
	| 'stick-case'
	| 'switch-oled'
	| 'laptop-numpad'
	| 'bookarc'
	| 'tablet'
	| 'phone'
	| 'phone-stand'
	| 'charger-multi'
	| 'hdmi-switch'
	| 'hub'
	| 'pen'
	| 'car';

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

/** 키보드: 몸체, 키 영역, 줄, 방향키·숫자패드 구역을 배열에 맞게 나눕니다. */
function keyboard(
	w: number,
	d: number,
	layout: 'full' | 'tkl' | '75' | '65' | '60' | 'hhkb' | 'magic'
): Shape[] {
	const pad = layout === 'magic' ? 0.6 : 1.1;
	const shapes: Shape[] = [rect(-w / 2, -d / 2, w, d, layout === 'magic' ? 1 : 0.8, 'body')];
	const top = -d / 2 + pad;
	const height = d - pad * 2;
	const rows = layout === '60' || layout === '65' || layout === 'hhkb' ? 5 : 6;
	const rowHeight = height / rows;
	const mainRatio = layout === 'full' ? 0.78 : layout === 'tkl' ? 0.82 : 1;
	const mainWidth = (w - pad * 2) * mainRatio - (mainRatio < 1 ? pad : 0);
	const left = -w / 2 + pad;
	shapes.push(rect(left, top, mainWidth, height, 0.4));
	for (let row = 1; row < rows; row += 1)
		shapes.push(
			line(left, top + row * rowHeight, left + mainWidth, top + row * rowHeight, 'faint')
		);
	// 스페이스바
	shapes.push(
		rect(
			left + mainWidth * 0.28,
			top + (rows - 1) * rowHeight + rowHeight * 0.15,
			mainWidth * 0.42,
			rowHeight * 0.7,
			0.3,
			'faint'
		)
	);
	if (mainRatio < 1) {
		const clusterLeft = left + mainWidth + pad;
		const clusterWidth = w / 2 - pad - clusterLeft;
		if (layout === 'full') {
			const nav = clusterWidth * 0.4;
			shapes.push(rect(clusterLeft, top + rowHeight, nav, rowHeight * 2, 0.3));
			shapes.push(rect(clusterLeft + nav * 0.33, top + rowHeight * 4, nav * 0.34, rowHeight, 0.3));
			shapes.push(
				rect(clusterLeft + nav + pad, top + rowHeight, clusterWidth - nav - pad, rowHeight * 5, 0.3)
			);
		} else {
			shapes.push(rect(clusterLeft, top + rowHeight, clusterWidth, rowHeight * 2, 0.3));
			shapes.push(
				rect(
					clusterLeft + clusterWidth * 0.33,
					top + rowHeight * 4,
					clusterWidth * 0.34,
					rowHeight * 2,
					0.3
				)
			);
		}
	}
	if (layout === '75' || layout === '65')
		shapes.push(
			rect(
				left + mainWidth * 0.9,
				top + height - rowHeight * 2,
				mainWidth * 0.1,
				rowHeight * 2,
				0.2,
				'faint'
			)
		);
	if (layout === 'hhkb')
		shapes.push(
			line(-w / 2 + pad, top + rowHeight * 4.3, -w * 0.28, top + rowHeight * 4.3, 'solid')
		);
	return shapes;
}

/** 마우스 윤곽. 앞이 위쪽(-y)입니다. */
function mouseShape(w: number, d: number, ergo: boolean): string {
	const hw = w / 2;
	const hd = d / 2;
	const thumb = ergo ? hw * 0.25 : 0;
	return `M0 ${-hd}C${hw} ${-hd} ${hw} ${-hd * 0.3} ${hw * 0.95} ${hd * 0.4}C${hw * 0.9} ${hd} ${-hw * 0.9} ${hd} ${-hw - thumb} ${hd * 0.4}C${-hw} ${-hd * 0.3} ${-hw} ${-hd} 0 ${-hd}Z`;
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
	],
	// 책상과 T자 다리 프레임
	mattz: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.2, 'body'),
		rect(-w * 0.42, -d * 0.38, 7, d * 0.76, 1, 'faint'),
		rect(w * 0.42 - 7, -d * 0.38, 7, d * 0.76, 1, 'faint'),
		line(-w * 0.42 + 7, 0, w * 0.42 - 7, 0, 'faint'),
		rect(w * 0.3, d / 2 - 4, 10, 2.5, 0.6)
	],
	footrest: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 3, 'body'),
		...[-0.3, -0.1, 0.1, 0.3].map((ratio) => line(-w * 0.4, d * ratio, w * 0.4, d * ratio, 'faint'))
	],
	'footrest-wave': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 4, 'body'),
		path(`M${-w * 0.4} 0Q${-w * 0.2} ${-d * 0.25} 0 0T${w * 0.4} 0`),
		path(`M${-w * 0.4} ${d * 0.25}Q${-w * 0.2} 0 0 ${d * 0.25}T${w * 0.4} ${d * 0.25}`, 'faint')
	],
	// 평면 화면과 Dell 사각 받침
	'dell-ultrasharp': (w, d) => [
		rect(-w * 0.17, -d / 2 + 0.5, w * 0.34, d * 0.78, 2, 'body'),
		rect(-w * 0.035, d / 2 - 7, w * 0.07, 3.5, 0.8),
		flatPanel(w, d, d / 2 - 4, 3.5)
	],
	// 책상 고정부, 두 마디 팔, VESA 판
	'monitor-arm': (w, d) => [
		rect(-w / 2, -d / 2, d * 0.7, d, 1.5, 'body'),
		path(`M${-w / 2 + d * 0.35} 0L${-w * 0.05} ${-d * 0.2}L${w / 2 - d * 0.4} 0`),
		circle(-w / 2 + d * 0.35, 0, d * 0.18, 'solid'),
		circle(-w * 0.05, -d * 0.2, d * 0.12),
		rect(w / 2 - d * 0.55, -d * 0.35, d * 0.5, d * 0.7, 0.8, 'body')
	],
	'light-bar': (w, d) => [
		rect(-w / 2, -d * 0.2, w, d * 0.4, d * 0.2, 'body'),
		rect(-w * 0.08, -d / 2, w * 0.16, d, 0.6, 'faint')
	],
	'kb-96': (w, d) => keyboard(w, d, 'full'),
	'kb-tkl': (w, d) => keyboard(w, d, 'tkl'),
	'kb-75': (w, d) => keyboard(w, d, '75'),
	'kb-65': (w, d) => keyboard(w, d, '65'),
	'kb-60': (w, d) => keyboard(w, d, '60'),
	'kb-hhkb': (w, d) => keyboard(w, d, 'hhkb'),
	'kb-magic': (w, d) => keyboard(w, d, 'magic'),
	// F13 텐키리스: 얇은 베젤, 떨어진 기능키 줄 끝의 F13, 앞쪽으로 살짝 보이는 하판
	'kb-phoenix': (w, d) => {
		const bezel = 0.8;
		const unit = (w - bezel * 2) / 18.25;
		const left = -w / 2 + bezel;
		const top = -d / 2 + bezel;
		const rowGap = unit * 0.25;
		const mainWidth = unit * 15;
		const fnRow = top + unit;
		const shapes: Shape[] = [
			rect(-w / 2 + 0.4, -d / 2 + 0.6, w - 0.8, d - 0.2, 0.8, 'faint'),
			rect(-w / 2, -d / 2, w, d - 0.6, 0.5, 'body'),
			rect(left, top, unit, unit, 0.2),
			...[0, 1, 2].map((group) =>
				rect(left + unit * (1.25 + group * 4.25), top, unit * 4, unit, 0.2)
			),
			rect(left + unit * 14, top, unit, unit, 0.2, 'solid'),
			rect(left + unit * 15.25, top, unit * 3, unit, 0.2),
			rect(left, fnRow + rowGap, mainWidth, unit * 5, 0.3),
			rect(left + unit * 15.25, fnRow + rowGap, unit * 3, unit * 2, 0.3),
			rect(left + unit * 16.25, fnRow + rowGap + unit * 3, unit, unit, 0.2),
			rect(left + unit * 15.25, fnRow + rowGap + unit * 4, unit * 3, unit, 0.2),
			rect(left + unit * 3.75, fnRow + rowGap + unit * 4.1, unit * 6.25, unit * 0.8, 0.2, 'faint')
		];
		for (let row = 1; row < 5; row += 1) {
			const y = fnRow + rowGap + row * unit;
			shapes.push(line(left, y, left + mainWidth, y, 'faint'));
		}
		return shapes;
	},
	'palm-rest': (w, d) => [
		rect(-w / 2, -d / 2, w, d, d * 0.35, 'body'),
		path(`M${-w * 0.42} ${-d * 0.1}Q0 ${-d * 0.3} ${w * 0.42} ${-d * 0.1}`, 'faint'),
		path(`M${-w * 0.42} ${d * 0.15}Q0 ${-d * 0.05} ${w * 0.42} ${d * 0.15}`, 'faint')
	],
	'mouse-palm': (w, d) => [
		path(`M${-w / 2} ${d / 2}L${-w * 0.35} ${-d / 2}H${w * 0.35}L${w / 2} ${d / 2}Z`, 'body'),
		line(-w * 0.3, 0, w * 0.3, 0, 'faint')
	],
	'mouse-symmetric': (w, d) => [
		path(mouseShape(w, d, false), 'body'),
		line(0, -d / 2, 0, -d * 0.05),
		rect(-w * 0.06, -d * 0.36, w * 0.12, d * 0.14, w * 0.06)
	],
	'mouse-ergo': (w, d) => [
		path(mouseShape(w, d, true), 'body'),
		line(0, -d / 2, 0, -d * 0.1),
		rect(-w * 0.07, -d * 0.36, w * 0.14, d * 0.16, w * 0.07),
		path(`M${-w * 0.55} ${d * 0.05}Q${-w * 0.5} ${d * 0.3} ${-w * 0.3} ${d * 0.42}`, 'faint')
	],
	'mouse-magic': (w, d) => [
		rect(-w / 2, -d / 2, w, d, w * 0.48, 'body'),
		line(0, -d * 0.42, 0, -d * 0.1, 'faint')
	],
	'mouse-vertical': (w, d) => [
		path(
			`M${-w * 0.3} ${-d / 2}C${w / 2} ${-d / 2} ${w / 2} ${d / 2} ${-w * 0.1} ${d / 2}C${-w / 2} ${d / 2} ${-w / 2} ${-d / 2} ${-w * 0.3} ${-d / 2}Z`,
			'body'
		),
		path(`M${-w * 0.15} ${-d * 0.4}Q${w * 0.3} 0 ${-w * 0.05} ${d * 0.4}`, 'faint'),
		circle(-w * 0.2, -d * 0.1, w * 0.08)
	],
	trackball: (w, d) => [
		path(mouseShape(w, d, true), 'body'),
		circle(-w * 0.22, d * 0.05, w * 0.2, 'solid'),
		line(w * 0.05, -d / 2, w * 0.05, -d * 0.1)
	],
	'mouse-dock': (w, d) => [
		circle(0, 0, Math.min(w, d) / 2, 'body'),
		circle(0, 0, Math.min(w, d) * 0.32, 'faint'),
		circle(0, 0, Math.min(w, d) * 0.08, 'solid')
	],
	mousepad: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		rect(-w / 2 + 0.6, -d / 2 + 0.6, w - 1.2, d - 1.2, 1, 'faint')
	],
	powerplay: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		rect(-w / 2 + 0.8, -d / 2 + 0.8, w - 1.6, d - 1.6, 1, 'faint'),
		circle(-w / 2 + 4, -d / 2 + 4, 2.5, 'solid')
	],
	katana: (w, d) => [
		rect(-w / 2, -d / 2, w, d, d * 0.3, 'body'),
		...dots(-w / 2 + 2, -d * 0.1, w * 0.35, d * 0.5, 1.4, 0.25),
		...dots(w * 0.15 - 2, -d * 0.1, w * 0.35, d * 0.5, 1.4, 0.25),
		rect(-w * 0.06, -d * 0.15, w * 0.12, d * 0.3, 0.4, 'solid')
	],
	'katana-sub': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		circle(0, -d * 0.15, w * 0.3),
		circle(0, d * 0.3, w * 0.12, 'faint')
	],
	// 정면의 큰 음량 손잡이와 붉은 고리
	'amp-knob': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		circle(w * 0.18, d / 2 - 4, 3.2, 'solid'),
		circle(w * 0.18, d / 2 - 4, 4.4),
		circle(-w * 0.3, d / 2 - 3, 1.2),
		line(-w / 2, d / 2 - 1.2, w / 2, d / 2 - 1.2, 'faint')
	],
	dongle: (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.3, 'body'),
		line(0, d / 2, 0, d / 2 + 1.5)
	],
	'dac-portable': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.2, 'body'),
		circle(0, -d * 0.3, w * 0.22),
		rect(-w * 0.35, d * 0.1, w * 0.7, d * 0.3, 0.6, 'faint')
	],
	dap: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.9, 'body'),
		rect(-w * 0.4, -d * 0.42, w * 0.8, d * 0.68, 0.5, 'solid'),
		circle(w / 2, -d * 0.3, 0.8)
	],
	radio: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		circle(-w * 0.22, 0, d * 0.32),
		...dotsInCircle(-w * 0.22, 0, d * 0.3, 1.2, 0.25),
		rect(w * 0.08, -d * 0.2, w * 0.28, d * 0.4, 0.5, 'faint'),
		circle(w * 0.42, 0, d * 0.12)
	],
	// 접어 놓은 헤드폰: 두 귀컵과 머리띠
	headphones: (w, d) => [
		path(
			`M${-w * 0.3} ${d * 0.1}C${-w * 0.45} ${-d * 0.6} ${w * 0.45} ${-d * 0.6} ${w * 0.3} ${d * 0.1}`
		),
		rect(-w / 2, d * 0.05, w * 0.36, d * 0.45, w * 0.15, 'body'),
		rect(w * 0.14, d * 0.05, w * 0.36, d * 0.45, w * 0.15, 'body')
	],
	// 두 이어피스와 Y자 케이블
	iem: (w, d) => [
		rect(-w / 2, -d / 2, w * 0.38, d * 0.55, w * 0.12, 'body'),
		rect(w * 0.12, -d / 2, w * 0.38, d * 0.55, w * 0.12, 'body'),
		path(
			`M${-w * 0.31} ${d * 0.05}Q${-w * 0.2} ${d * 0.4} 0 ${d / 2}Q${w * 0.2} ${d * 0.4} ${w * 0.31} ${d * 0.05}`,
			'faint'
		)
	],
	// 귀 모양을 따른 셸 대신 둥근 원판형 이어버드
	'earbud-round': (w, d) => [
		circle(-w * 0.25, -d * 0.15, Math.min(w, d) * 0.3, 'body'),
		circle(w * 0.25, -d * 0.15, Math.min(w, d) * 0.3, 'body'),
		circle(-w * 0.25, -d * 0.15, Math.min(w, d) * 0.12, 'faint'),
		circle(w * 0.25, -d * 0.15, Math.min(w, d) * 0.12, 'faint'),
		path(`M${-w * 0.25} ${d * 0.15}Q0 ${d * 0.5} ${w * 0.25} ${d * 0.15}`, 'faint')
	],
	// 귀에 거는 고리가 달린 이어폰
	earhook: (w, d) => [
		circle(-w * 0.25, d * 0.05, Math.min(w, d) * 0.18, 'body'),
		circle(w * 0.25, d * 0.05, Math.min(w, d) * 0.18, 'body'),
		path(
			`M${-w * 0.25} ${-d * 0.1}C${-w * 0.55} ${-d * 0.5} ${-w * 0.05} ${-d * 0.55} ${-w * 0.1} ${-d * 0.15}`
		),
		path(
			`M${w * 0.25} ${-d * 0.1}C${w * 0.55} ${-d * 0.5} ${w * 0.05} ${-d * 0.55} ${w * 0.1} ${-d * 0.15}`
		)
	],
	// 작은 원통형 몸체
	'iem-bullet': (w, d) => [
		rect(-w * 0.4, -d * 0.45, w * 0.18, d * 0.5, w * 0.09, 'body'),
		rect(w * 0.22, -d * 0.45, w * 0.18, d * 0.5, w * 0.09, 'body'),
		path(`M${-w * 0.31} ${d * 0.05}Q0 ${d * 0.5} ${w * 0.31} ${d * 0.05}`, 'faint')
	],
	'earbuds-case': (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.45, 'body'),
		line(-w * 0.42, -d * 0.1, w * 0.42, -d * 0.1, 'faint'),
		circle(0, d * 0.2, 0.4, 'dot')
	],
	'stick-case': (w, d) => [
		rect(-w / 2, -d / 2, w, d, d / 2, 'body'),
		rect(-w * 0.35, -d * 0.3, w * 0.7, d * 0.6, d * 0.3, 'faint')
	],
	// 독에 꽂힌 본체와 양쪽 조이콘
	'switch-oled': (w, d) => [
		rect(-w * 0.36, -d / 2, w * 0.72, d * 0.95, 1, 'body'),
		rect(-w / 2, -d * 0.12, w, d * 0.24, 0.6, 'solid'),
		rect(-w / 2, -d * 0.12, w * 0.16, d * 0.24, 0.8),
		rect(w / 2 - w * 0.16, -d * 0.12, w * 0.16, d * 0.24, 0.8)
	],
	'laptop-numpad': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		rect(-w * 0.45, -d / 2, w * 0.9, 1.2, 0.4, 'solid'),
		rect(-w * 0.44, -d * 0.36, w * 0.66, d * 0.38, 0.6),
		rect(w * 0.25, -d * 0.36, w * 0.19, d * 0.38, 0.6),
		...[0, 1, 2, 3, 4].map((row) =>
			line(-w * 0.42, -d * 0.3 + row * d * 0.07, w * 0.42, -d * 0.3 + row * d * 0.07, 'faint')
		),
		rect(-w * 0.27, d * 0.1, w * 0.3, d * 0.3, 0.6),
		...dots(-w * 0.45, -d * 0.48, w * 0.9, 0.9, 1, 0.15)
	],
	// 아치 모양 받침과 노트북을 꽂는 홈
	bookarc: (w, d) => [
		path(`M${-w / 2} ${d / 2}Q0 ${-d * 1.1} ${w / 2} ${d / 2}Z`, 'body'),
		rect(-w * 0.08, -d * 0.2, w * 0.16, d * 0.55, 0.3, 'solid')
	],
	tablet: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.2, 'body'),
		rect(-w / 2 + 0.8, -d / 2 + 0.8, w - 1.6, d - 1.6, 0.6, 'faint'),
		circle(-w / 2 + 1.8, -d / 2 + 1.8, 0.5)
	],
	phone: (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		circle(-w * 0.25, -d * 0.38, 0.6),
		circle(-w * 0.25, -d * 0.3, 0.6),
		circle(-w * 0.25, -d * 0.22, 0.6)
	],
	'phone-stand': (w, d) => [
		rect(-w / 2, -d / 2, w, d, w * 0.3, 'body'),
		circle(0, -d * 0.1, w * 0.3),
		line(0, d * 0.2, 0, d * 0.4)
	],
	// 휴대폰·이어폰·시계 충전 자리
	'charger-multi': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		circle(-w * 0.25, 0, d * 0.32),
		circle(w * 0.12, 0, d * 0.22),
		circle(w * 0.36, -d * 0.15, d * 0.12, 'solid')
	],
	'hdmi-switch': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.6, 'body'),
		...dots(-w * 0.4, -d / 2 + 0.2, w * 0.8, 1.2, 1.4, 0.35),
		circle(w * 0.3, d * 0.25, 0.7)
	],
	hub: (w, d) => [
		rect(-w / 2, -d / 2, w, d, d * 0.3, 'body'),
		...dots(-w * 0.35, -d * 0.2, w * 0.7, d * 0.4, 1.3, 0.3),
		line(-w / 2, 0, -w / 2 - 2, 0)
	],
	pen: (w, d) => [
		rect(-w / 2, -d / 2, w, d, d / 2, 'body'),
		line(-w * 0.2, -d * 0.45, w * 0.25, -d * 0.45, 'solid'),
		circle(w / 2 - 0.6, 0, d * 0.2, 'dot')
	],
	// 위에서 본 세단: 본네트, 앞유리, 지붕, 뒷유리
	car: (w, d) => [
		rect(-w / 2, -d / 2, w, d, d * 0.35, 'body'),
		rect(-w * 0.12, -d * 0.38, w * 0.38, d * 0.76, d * 0.2),
		line(-w * 0.12, -d * 0.36, -w * 0.12, d * 0.36, 'faint'),
		line(w * 0.26, -d * 0.36, w * 0.26, d * 0.36, 'faint'),
		path(
			`M${-w * 0.45} ${-d * 0.25}L${-w * 0.3} ${-d * 0.3}M${-w * 0.45} ${d * 0.25}L${-w * 0.3} ${d * 0.3}`,
			'faint'
		)
	]
};

export function drawModel(id: GlyphId, w: number, d: number): Shape[] {
	return MODEL_GLYPHS[id](w, d);
}
