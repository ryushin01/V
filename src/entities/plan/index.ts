export { deletePlan, getPlan, listPlans, savePlan } from './api/plans-db';
export { analyzePlan, CHAIR_CLEARANCE_CM, viewingRange } from './model/analysis';
export { CATALOG, CATEGORY_LABELS, getCatalogEntry } from './model/catalog';
export { createEmptyPlan, createSamplePlan } from './model/factory';
export { findFreeSpot, halfExtents } from './model/placement';
export {
	openingGeometry,
	PLAN_LIMITS,
	ROOM_LIMITS,
	snapToWall,
	WALL_LABELS,
	wallLength
} from './model/room';
export { parsePlan, stringifyPlan } from './model/serialize';
export type {
	Analysis,
	CatalogCategory,
	CatalogEntry,
	Connection,
	Finding,
	ItemData,
	Opening,
	PlanData,
	RoomData,
	Wall
} from './model/types';
export { default as ItemGlyph } from './ui/ItemGlyph.svelte';
export { default as PlanPreview } from './ui/PlanPreview.svelte';
export { default as RoomOutline } from './ui/RoomOutline.svelte';
