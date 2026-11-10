export {
	deleteCustomProduct,
	deletePlan,
	getPlan,
	listCustomProducts,
	listPlans,
	saveCustomProduct,
	saveCustomProducts,
	savePlan
} from './api/plans-db';
export {
	createCustomEntry,
	CUSTOM_KINDS,
	DEFAULT_SCREEN_INCH,
	KIND_PRESETS,
	toCustomInput,
	type CustomProductInput
} from './model/custom';
export {
	CUSTOM_FILE_LIMIT,
	parseCustomProductsFile,
	stringifyCustomProducts,
	type CustomFileResult
} from './model/custom-file';
export { analyzePlan, CHAIR_CLEARANCE_CM, viewingRange } from './model/analysis';
export {
	CATALOG,
	CATEGORY_LABELS,
	getCatalogEntry,
	matchesCatalogQuery,
	registerCustomEntries,
	resolveEntry,
	SPEC_LIMITS,
	unregisterCustomEntry,
	WATTS_BASIS_LABELS
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
	ItemKind,
	ItemSpecs,
	Opening,
	PlanData,
	RoomData,
	SpecKey,
	Underlay,
	WattsBasis,
	Wall
} from './model/types';
export { default as ItemGlyph } from './ui/ItemGlyph.svelte';
export { default as PlanPreview } from './ui/PlanPreview.svelte';
export { default as RoomOutline } from './ui/RoomOutline.svelte';
export { default as XrayOverlay } from './ui/XrayOverlay.svelte';
