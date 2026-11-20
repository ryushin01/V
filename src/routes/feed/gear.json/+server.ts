import { json } from '@sveltejs/kit';
// 브라우저 전용 코드(IndexedDB, 화면 컴포넌트)를 빌드 서버에서 읽지 않도록 모델 파일을 바로 가져옵니다.
import { MODEL_ENTRIES } from '../../../entities/plan/model/catalog-models';
import { plannerFeed } from '../../../entities/plan/model/sync/planner-feed';

export const prerender = true;

/** My-First-Gear 쇼핑몰이 매일 가져가는 V 실제 모델 목록입니다. 빌드할 때 build/feed/gear.json으로 만듭니다. */
export function GET() {
	return json(plannerFeed(MODEL_ENTRIES));
}
