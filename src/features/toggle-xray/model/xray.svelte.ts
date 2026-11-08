/** 도면 아래의 치수와 케이블을 드러내는 보기 상태입니다. 페이지를 옮겨도 유지됩니다. */
class XrayState {
	on = $state(false);

	toggle() {
		this.on = !this.on;
		if (typeof document === 'undefined') return;
		if (this.on) document.documentElement.dataset.xray = 'on';
		else delete document.documentElement.dataset.xray;
	}
}

export const xray = new XrayState();
