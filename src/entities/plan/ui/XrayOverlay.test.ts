import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { analyzePlan } from '../model/analysis';
import { createSamplePlan } from '../model/factory';
import XrayOverlay from './XrayOverlay.svelte';

function setup(scale = 2) {
	const plan = createSamplePlan();
	const { connections } = analyzePlan(plan.room, plan.items);
	render(XrayOverlay, { room: plan.room, items: plan.items, connections, scale });
	return screen.getByTestId('xray-overlay');
}

describe('XrayOverlay', () => {
	it('방 크기와 물건 치수를 드러냅니다', () => {
		const overlay = setup();
		expect(overlay.textContent).toContain('460cm');
		expect(overlay.textContent).toContain('380cm');
		expect(overlay.textContent).toContain('160×80');
	});

	it('케이블 길이와 TV 권장 거리를 드러냅니다', () => {
		const overlay = setup();
		expect(overlay.textContent).toContain('245cm');
		expect(overlay.textContent).toContain('167~227cm');
	});

	it('같은 정보가 점검 패널에 있으므로 보조기술에는 숨깁니다', () => {
		expect(setup().getAttribute('aria-hidden')).toBe('true');
	});
});
