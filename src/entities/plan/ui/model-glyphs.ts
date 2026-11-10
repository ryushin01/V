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
	| 'car'
	| 'desk-motion'
	| 'desk-wood'
	| 'shelf-plank'
	| 'shelf-steel'
	| 'shelf-tiered'
	| 'shelf-modular'
	| 'shelf-dual'
	| 'studio-stand'
	| 'speaker-stand'
	| 'desk-mat-leather'
	| 'desk-mat-felt'
	| 'speaker-bookshelf'
	| 'speaker-knob'
	| 'speaker-acton'
	| 'speaker-pebble'
	| 'light-bar-halo'
	| 'hue-play'
	| 'wall-washer'
	| 'floor-lamp'
	| 'pole-lamp'
	| 'hue-bridge'
	| 'touch-strip'
	| 'photo-frame'
	| 'stream-deck'
	| 'gamepad-micro'
	| 'wrist-rest-wave'
	| 'footrest-step'
	| 'footrest-dual'
	| 'chair-omni'
	| 'chair-uniback'
	| 'charger-stand'
	| 'cable-tray'
	| 'tray'
	| 'tray-handle'
	| 'coaster-set'
	| 'diffuser-reed'
	| 'stone-diffuser'
	| 'lava-ball'
	| 'clock-frame'
	| 'timer-cube'
	| 'thermo-hygro'
	| 'flower-lamp'
	| 'coaster-light'
	| 'poster-frame';

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

/** 의자 아래 다섯 갈래 다리와 바퀴 */
function starBase(w: number, d: number): Shape[] {
	const legs: Shape[] = [];
	const radius = Math.min(w, d) * 0.46;
	for (let index = 0; index < 5; index += 1) {
		const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		legs.push(line(0, 0, x, y), circle(x, y, 2.2, 'solid'));
	}
	return legs;
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
	// 2단 기둥과 T자 발, 앞쪽 오른편의 높이 조절 버튼
	'desk-motion': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.2, 'body'),
		rect(-w * 0.4 - 3, -d * 0.4, 6, d * 0.8, 1, 'faint'),
		rect(w * 0.4 - 3, -d * 0.4, 6, d * 0.8, 1, 'faint'),
		rect(-w * 0.4 - 2, -2.5, 4, 5, 0.6),
		rect(w * 0.4 - 2, -2.5, 4, 5, 0.6),
		line(-w * 0.4 + 2, 0, w * 0.4 - 2, 0, 'faint'),
		rect(w * 0.28, d / 2 - 2.6, 9, 2, 0.6, 'solid')
	],
	// 둥근 모서리의 원목 상판과 나뭇결
	'desk-wood': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 3, 'body'),
		...[-0.28, -0.05, 0.2].map((ratio) =>
			path(
				`M${-w * 0.45} ${d * ratio}C${-w * 0.2} ${d * (ratio - 0.08)} ${w * 0.05} ${d * (ratio + 0.08)} ${w * 0.45} ${d * ratio}`,
				'faint'
			)
		),
		rect(-w * 0.4 - 3, -d * 0.4, 6, d * 0.8, 1, 'faint'),
		rect(w * 0.4 - 3, -d * 0.4, 6, d * 0.8, 1, 'faint')
	],
	// 긴 상판과 양 끝 다리
	'shelf-plank': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.8, 'body'),
		rect(-w / 2 + 1, -d / 2 + 1, Math.max(2, w * 0.04), d - 2, 0.4, 'faint'),
		rect(w / 2 - 1 - Math.max(2, w * 0.04), -d / 2 + 1, Math.max(2, w * 0.04), d - 2, 0.4, 'faint'),
		line(-w / 2, d / 2 - 1, w / 2, d / 2 - 1, 'faint')
	],
	// 얇은 금속판과 네 귀퉁이 다리
	'shelf-steel': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.6, 'body'),
		...[
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1]
		].map(([x, y]) => circle((x * w) / 2 - x * 3, (y * d) / 2 - y * 3, 1.2, 'solid')),
		...dots(-w * 0.3, -d * 0.1, w * 0.6, d * 0.2, 6, 0.35)
	],
	// 앞뒤로 높이가 다른 두 단
	'shelf-tiered': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.8, 'body'),
		rect(-w / 2 + 1, -d / 2 + 1, w - 2, d * 0.45, 0.6),
		line(-w / 2, d * 0.05, w / 2, d * 0.05, 'faint'),
		line(-w / 2 + 1, d / 2 - 1.5, w / 2 - 1, d / 2 - 1.5, 'faint')
	],
	// 칸을 이어 붙이는 모듈형 받침대
	'shelf-modular': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		line(-w / 6, -d / 2, -w / 6, d / 2, 'faint'),
		line(w / 6, -d / 2, w / 6, d / 2, 'faint'),
		rect(-w * 0.45, -d * 0.3, w * 0.22, d * 0.6, 0.6, 'faint')
	],
	// 두 화면을 받치는 넓은 알루미늄 판과 접힌 양 끝
	'shelf-dual': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		line(-w / 2 + 3, -d / 2, -w / 2 + 3, d / 2, 'faint'),
		line(w / 2 - 3, -d / 2, w / 2 - 3, d / 2, 'faint'),
		line(0, -d / 2 + 2, 0, d / 2 - 2, 'faint')
	],
	// 전원부를 품은 모니터 받침대와 앞쪽 조명 띠
	'studio-stand': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.2, 'body'),
		line(-w / 2 + 2, d / 2 - 1.5, w / 2 - 2, d / 2 - 1.5, 'solid'),
		...dots(-w * 0.42, -d * 0.35, w * 0.2, d * 0.3, 2.2, 0.4),
		rect(w * 0.25, -d * 0.35, w * 0.18, d * 0.3, 0.6, 'faint')
	],
	// 받침 위의 회전하는 윗판
	'speaker-stand': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		circle(0, 0, Math.min(w, d) * 0.18, 'solid'),
		rect(-w * 0.32, -d * 0.4, w * 0.64, d * 0.8, 1, 'faint')
	],
	// 박음질 선과 마그네틱 홀더
	'desk-mat-leather': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		rect(-w / 2 + 1.2, -d / 2 + 1.2, w - 2.4, d - 2.4, 1, 'faint'),
		rect(w / 2 - 12, -d / 2 + 3, 8, 3, 1.5)
	],
	// 펠트 결을 점으로
	'desk-mat-felt': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 2, 'body'),
		...dots(-w / 2 + 3, -d / 2 + 3, w - 6, d - 6, Math.max(6, w / 14), 0.3)
	],
	// 위에서 본 북셀프 스피커: 상자와 앞면 배플
	'speaker-bookshelf': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		line(-w / 2, d / 2 - 1.6, w / 2, d / 2 - 1.6),
		rect(-w * 0.3, d / 2 - 1.2, w * 0.6, 0.8, 0.4, 'faint')
	],
	// 윗면에 음량 손잡이가 있는 액티브 스피커
	'speaker-knob': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		line(-w / 2, d / 2 - 1.6, w / 2, d / 2 - 1.6),
		circle(w * 0.18, d * 0.18, Math.min(w, d) * 0.12),
		circle(w * 0.18, d * 0.18, Math.min(w, d) * 0.04, 'solid')
	],
	// 윗면 금색 띠의 손잡이 줄과 앞면 그릴
	'speaker-acton': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		...dots(-w / 2 + 1, d / 2 - 3.4, w - 2, 3, 1.2, 0.25),
		line(-w / 2, d * 0.12, w / 2, d * 0.12, 'faint'),
		...[0.08, 0.2, 0.32, 0.42].map((ratio) => circle(w * ratio, -d * 0.06, Math.min(w, d) * 0.045))
	],
	// 공 모양 몸체와 45도 위를 보는 드라이버
	'speaker-pebble': (w, d) => [
		path(
			`M0 ${-d / 2}C${w * 0.55} ${-d / 2} ${w * 0.55} ${d / 2} 0 ${d / 2}C${-w * 0.55} ${d / 2} ${-w * 0.55} ${-d / 2} 0 ${-d / 2}Z`,
			'body'
		),
		circle(0, d * 0.12, Math.min(w, d) * 0.26),
		circle(0, d * 0.12, Math.min(w, d) * 0.08, 'solid')
	],
	// 앞 조명 막대와 뒤쪽 무드등, 화면 위 고정부
	'light-bar-halo': (w, d) => [
		path(`M${-w * 0.42} ${-d * 0.1}Q0 ${-d * 0.6} ${w * 0.42} ${-d * 0.1}`, 'faint'),
		rect(-w / 2, -d * 0.05, w, d * 0.3, d * 0.15, 'body'),
		rect(-w * 0.08, -d / 2, w * 0.16, d, 0.6, 'faint'),
		rect(-w * 0.12, d * 0.25, w * 0.24, d * 0.2, 0.6)
	],
	// 받침에 눕힌 납작한 조명 막대
	'hue-play': (w, d) => [
		rect(-w / 2, -d / 2, w, d, d * 0.3, 'body'),
		line(-w * 0.44, d * 0.2, w * 0.44, d * 0.2, 'faint'),
		rect(-w * 0.1, -d / 2, w * 0.2, d * 0.25, 0.3, 'solid')
	],
	// 원통형 몸체와 위로 열린 렌즈
	'wall-washer': (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.45, 'body'),
		path(`M${-w * 0.35} ${-d * 0.2}Q0 ${-d * 0.45} ${w * 0.35} ${-d * 0.2}`),
		circle(0, d * 0.15, Math.min(w, d) * 0.12, 'faint')
	],
	// 둥근 받침과 기둥, 위의 갓
	'floor-lamp': (w, d) => [
		circle(0, 0, Math.min(w, d) / 2, 'body'),
		circle(0, 0, Math.min(w, d) * 0.36, 'faint'),
		circle(0, 0, Math.min(w, d) * 0.08, 'solid')
	],
	// 좁은 받침에 세운 막대 조명
	'pole-lamp': (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.2, 'body'),
		circle(0, 0, Math.min(w, d) * 0.14, 'solid'),
		line(-w * 0.3, d * 0.3, w * 0.3, d * 0.3, 'faint')
	],
	// 둥근 사각 브리지와 상태 표시등
	'hue-bridge': (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.22, 'body'),
		circle(0, 0, Math.min(w, d) * 0.22, 'faint'),
		...[-0.12, 0, 0.12].map((ratio) => circle(w * ratio, d * 0.32, 0.45, 'solid'))
	],
	// 길고 낮은 터치 화면과 뒤쪽 받침
	'touch-strip': (w, d) => [
		rect(-w * 0.3, -d / 2 + 0.5, w * 0.6, d * 0.55, 1.5, 'body'),
		flatPanel(w, d, d / 2 - 2.4, 2),
		line(-w * 0.48, d / 2 - 1.4, w * 0.48, d / 2 - 1.4, 'faint')
	],
	// 투명 화면 액자와 받침
	'photo-frame': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.8, 'body'),
		rect(-w / 2 + 0.6, -d * 0.1, w - 1.2, d * 0.2, 0.3, 'faint'),
		rect(-w * 0.1, -d / 2, w * 0.2, d * 0.3, 0.4, 'solid')
	],
	// 버튼 8개, 손잡이 4개와 그 사이 터치 띠
	'stream-deck': (w, d) => {
		const key = Math.min(w / 4.8, d / 5);
		const keys: Shape[] = [];
		for (let row = 0; row < 2; row += 1)
			for (let column = 0; column < 4; column += 1)
				keys.push(rect(-w * 0.42 + column * w * 0.215, -d * 0.42 + row * key * 1.2, key, key, 0.5));
		return [
			rect(-w / 2, -d / 2, w, d, 1.2, 'body'),
			...keys,
			rect(-w * 0.42, d * 0.06, w * 0.84, d * 0.12, 0.4, 'solid'),
			...[0, 1, 2, 3].map((column) =>
				circle(-w * 0.32 + column * w * 0.215, d * 0.33, Math.min(w, d) * 0.07)
			)
		];
	},
	// 손바닥만 한 패드: 십자키와 버튼 넷
	'gamepad-micro': (w, d) => [
		rect(-w / 2, -d / 2, w, d, d * 0.35, 'body'),
		path(`M${-w * 0.28} ${-d * 0.2}V${d * 0.2}M${-w * 0.38} 0H${-w * 0.18}`, 'solid'),
		...[
			[0.28, -0.18],
			[0.38, 0],
			[0.28, 0.18],
			[0.18, 0]
		].map(([x, y]) => circle(w * x, d * y, d * 0.08, 'solid')),
		line(-w * 0.05, -d * 0.1, w * 0.05, -d * 0.1, 'faint')
	],
	// 손목을 따라 물결치는 원목
	'wrist-rest-wave': (w, d) => [
		rect(-w / 2, -d / 2, w, d, d * 0.4, 'body'),
		path(`M${-w * 0.42} 0Q${-w * 0.21} ${-d * 0.25} 0 0T${w * 0.42} 0`, 'faint'),
		path(
			`M${-w * 0.42} ${d * 0.22}Q${-w * 0.21} ${-d * 0.03} 0 ${d * 0.22}T${w * 0.42} ${d * 0.22}`,
			'faint'
		)
	],
	// 높이가 다른 두 발판
	'footrest-step': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 2.5, 'body'),
		rect(-w / 2 + 2, -d / 2 + 2, w - 4, d * 0.42, 2),
		...[0.2, 0.32].map((ratio) => line(-w * 0.4, d * ratio, w * 0.4, d * ratio, 'faint'))
	],
	// 아래 발판과 발목을 올리는 위 받침
	'footrest-dual': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 3, 'body'),
		rect(-w * 0.42, -d * 0.42, w * 0.84, d * 0.3, d * 0.15),
		path(`M${-w * 0.4} ${d * 0.2}Q0 ${d * 0.32} ${w * 0.4} ${d * 0.2}`, 'faint')
	],
	// 다섯 갈래 다리와 세로로 나뉜 등받이
	'chair-omni': (w, d) => [
		...starBase(w, d),
		rect(-w * 0.28, -d * 0.32, w * 0.56, d * 0.5, w * 0.08, 'body'),
		path(`M${-w * 0.3} ${d * 0.26}Q0 ${d * 0.42} ${w * 0.3} ${d * 0.26}`),
		line(0, d * 0.24, 0, d * 0.4, 'solid'),
		rect(-w * 0.44, -d * 0.14, 3, d * 0.3, 1.5, 'body'),
		rect(w * 0.44 - 3, -d * 0.14, 3, d * 0.3, 1.5, 'body')
	],
	// 앞이 둥글게 내려가는 곡면 좌판과 넓은 등받이
	'chair-uniback': (w, d) => [
		...starBase(w, d),
		path(
			`M${-w * 0.27} ${d * 0.18}V${-d * 0.18}Q${-w * 0.27} ${-d * 0.34} 0 ${-d * 0.34}Q${w * 0.27} ${-d * 0.34} ${w * 0.27} ${-d * 0.18}V${d * 0.18}Z`,
			'body'
		),
		path(`M${-w * 0.18} ${-d * 0.05}Q0 ${d * 0.05} ${w * 0.18} ${-d * 0.05}`, 'faint'),
		path(`M${-w * 0.32} ${d * 0.24}Q0 ${d * 0.4} ${w * 0.32} ${d * 0.24}`),
		rect(-w * 0.42, -d * 0.12, 3, d * 0.28, 1.5, 'body'),
		rect(w * 0.42 - 3, -d * 0.12, 3, d * 0.28, 1.5, 'body')
	],
	// 받침의 이어폰 자리, 세운 휴대폰 판, 시계 충전부
	'charger-stand': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1.5, 'body'),
		rect(-w * 0.42, -d * 0.35, w * 0.4, d * 0.2, 0.6, 'solid'),
		circle(-w * 0.22, d * 0.15, d * 0.22),
		circle(w * 0.28, d * 0.1, d * 0.16),
		line(w * 0.28, -d * 0.4, w * 0.28, -d * 0.1, 'faint')
	],
	// 책상 밑에 다는 열린 트레이와 클램프
	'cable-tray': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.8, 'body'),
		rect(-w / 2 + 1, -d / 2 + 1, w - 2, d - 2, 0.6, 'faint'),
		rect(-w * 0.35 - 2, -d / 2 - 1, 4, 3, 0.4, 'solid'),
		rect(w * 0.35 - 2, -d / 2 - 1, 4, 3, 0.4, 'solid')
	],
	tray: (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.2, 'body'),
		rect(-w / 2 + 1.2, -d / 2 + 1.2, w - 2.4, d - 2.4, Math.min(w, d) * 0.15, 'faint')
	],
	// 손잡이 홈이 있는 원목 트레이
	'tray-handle': (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.35, 'body'),
		rect(-w / 2 + 1.5, -d / 2 + 1.5, w - 3, d - 3, Math.min(w, d) * 0.3, 'faint'),
		rect(-w / 2 + 2, -d * 0.12, 2.5, d * 0.24, 1),
		rect(w / 2 - 4.5, -d * 0.12, 2.5, d * 0.24, 1)
	],
	// 원목 받침에 꽂은 원형 코스터
	'coaster-set': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 1, 'body'),
		circle(0, d * 0.05, Math.min(w, d) * 0.42),
		circle(0, d * 0.05, Math.min(w, d) * 0.3, 'faint')
	],
	// 병과 퍼져 나온 막대
	'diffuser-reed': (w, d) => {
		const r = Math.min(w, d) / 2;
		return [
			circle(0, 0, r * 0.8, 'body'),
			circle(0, 0, r * 0.25, 'faint'),
			...[0, 1, 2, 3, 4].map((index) => {
				const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
				return line(0, 0, Math.cos(angle) * r, Math.sin(angle) * r);
			})
		];
	},
	// 접시 위의 돌 여러 개
	'stone-diffuser': (w, d) => [
		circle(0, 0, Math.min(w, d) / 2, 'body'),
		...[
			[-0.18, -0.12, 0.16],
			[0.15, -0.15, 0.13],
			[0.05, 0.16, 0.17],
			[-0.2, 0.18, 0.1]
		].map(([x, y, r]) => circle(w * x, d * y, Math.min(w, d) * r))
	],
	'lava-ball': (w, d) => [
		circle(0, 0, Math.min(w, d) / 2, 'body'),
		...[
			[-0.14, -0.1],
			[0.14, -0.1],
			[0, 0.15]
		].map(([x, y]) => circle(w * x, d * y, Math.min(w, d) * 0.14, 'solid'))
	],
	// 얇은 액자형 시계와 뒤 받침
	'clock-frame': (w, d) => [
		rect(-w / 2, d * 0.1, w, d * 0.4, 0.4, 'body'),
		path(
			`M${-w * 0.3} ${d * 0.1}L${-w * 0.2} ${-d / 2}M${w * 0.3} ${d * 0.1}L${w * 0.2} ${-d / 2}`,
			'faint'
		)
	],
	// 위에 다이얼이 있는 육면체 타이머
	'timer-cube': (w, d) => [
		rect(-w / 2, -d / 2, w, d, Math.min(w, d) * 0.2, 'body'),
		circle(0, 0, Math.min(w, d) * 0.32),
		line(0, 0, 0, -Math.min(w, d) * 0.25, 'solid')
	],
	// 작은 화면이 있는 온습도계
	'thermo-hygro': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.6, 'body'),
		rect(-w * 0.4, -d * 0.1, w * 0.8, d * 0.5, 0.3, 'solid')
	],
	// 코스터 조명 위의 장미
	'flower-lamp': (w, d) => {
		const r = Math.min(w, d) / 2;
		return [
			circle(0, 0, r, 'body'),
			...[0, 1, 2, 3, 4].map((index) => {
				const angle = (Math.PI * 2 * index) / 5;
				return circle(Math.cos(angle) * r * 0.32, Math.sin(angle) * r * 0.32, r * 0.3);
			}),
			circle(0, 0, r * 0.15, 'solid')
		];
	},
	// 빛이 새는 고리 모양 코스터
	'coaster-light': (w, d) => [
		circle(0, 0, Math.min(w, d) / 2, 'body'),
		circle(0, 0, Math.min(w, d) * 0.38, 'faint'),
		circle(0, 0, Math.min(w, d) * 0.3)
	],
	// 벽에 건 액자
	'poster-frame': (w, d) => [
		rect(-w / 2, -d / 2, w, d, 0.2, 'body'),
		line(-w / 2 + 1.5, 0, w / 2 - 1.5, 0, 'faint')
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
