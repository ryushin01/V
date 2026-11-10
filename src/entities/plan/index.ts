export { deletePlan, getPlan, listPlans, savePlan } from './api/plans-db';
export { analyzePlan, CHAIR_CLEARANCE_CM, viewingRange } from './model/analysis';
export {
	CATALOG,
	CATEGORY_LABELS,
	getCatalogEntry,
	resolveEntry,
	SPEC_LIMITS
} from './model/catalog';
export { decodePlan, encodePlan } from './api/share-link';
export { createEmptyPlan, createSamplePlan } from './model/factory';
export { findFreeSpot, halfExtents } from './model/placement';
export {
	CORNER_LABELS,
	cutoutLimits,
	isOutsideRoom,
	openingGeometry,
	PLAN_LIMITS,
	ROOM_LIMITS,
	roomOutline,
	snapToWall,
	WALL_LABELS,
	wallLength,
	wallRange
} from './model/room';
export { parsePlan, stringifyPlan } from './model/serialize';
export type {
	Analysis,
	CatalogCategory,
	CatalogEntry,
	Connection,
	Corner,
	Cutout,
	Finding,
	ItemData,
	ItemSpecs,
	Opening,
	PlanData,
	RoomData,
	SpecKey,
	Underlay,
	Wall
} from './model/types';
export { default as ItemGlyph } from './ui/ItemGlyph.svelte';
export { default as PlanPreview } from './ui/PlanPreview.svelte';
export { default as RoomOutline } from './ui/RoomOutline.svelte';
export { default as XrayOverlay } from './ui/XrayOverlay.svelte';
