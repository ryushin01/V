const MIN_SCALE = 0.3;
const MAX_SCALE = 8;

/** 화면 좌표 = cm × scale + offset */
export class Viewport {
	width = $state(0);
	height = $state(0);
	scale = $state(1.6);
	offsetX = $state(0);
	offsetY = $state(0);

	readonly zoomPercent = $derived(Math.round((this.scale / 1.6) * 100));

	fit(roomWidth: number, roomDepth: number, padding = 56) {
		if (this.width <= 0 || this.height <= 0) return;
		const scale = Math.min(
			(this.width - padding * 2) / roomWidth,
			(this.height - padding * 2) / roomDepth
		);
		this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
		this.offsetX = (this.width - roomWidth * this.scale) / 2;
		this.offsetY = (this.height - roomDepth * this.scale) / 2;
	}

	zoomAt(screenX: number, screenY: number, factor: number) {
		const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale * factor));
		const ratio = next / this.scale;
		this.offsetX = screenX - (screenX - this.offsetX) * ratio;
		this.offsetY = screenY - (screenY - this.offsetY) * ratio;
		this.scale = next;
	}

	zoomCenter(factor: number) {
		this.zoomAt(this.width / 2, this.height / 2, factor);
	}

	panBy(dx: number, dy: number) {
		this.offsetX += dx;
		this.offsetY += dy;
	}

	toWorld(screenX: number, screenY: number) {
		return { x: (screenX - this.offsetX) / this.scale, y: (screenY - this.offsetY) / this.scale };
	}
}
