import { boundsOf, corners, type RotatedRect } from '#shared/lib/geometry';
import { resolveEntry, type CatalogEntry, type ItemData, type ItemSpecs } from '#entities/plan';

/** 물건 하나의 상태입니다. 좌표가 바뀌면 이 물건을 쓰는 값만 다시 계산됩니다. */
export class PlacedItem implements ItemData {
	readonly id: string;
	readonly catalogId: string;
	specs = $state<ItemSpecs>({});
	readonly entry: CatalogEntry = $derived.by(() =>
		resolveEntry({ catalogId: this.catalogId, specs: this.specs })
	);
	label = $state('');
	x = $state(0);
	y = $state(0);
	rotation = $state(0);
	price = $state(0);

	readonly name = $derived.by(() => this.label || this.entry.name);
	readonly rect: RotatedRect = $derived.by(() => ({
		cx: this.x,
		cy: this.y,
		width: this.entry.width,
		depth: this.entry.depth,
		rotation: this.rotation
	}));
	readonly bounds = $derived(boundsOf(corners(this.rect)));

	constructor(data: ItemData) {
		this.id = data.id;
		this.catalogId = data.catalogId;
		this.specs = { ...data.specs };
		this.label = data.label;
		this.x = data.x;
		this.y = data.y;
		this.rotation = data.rotation;
		this.price = data.price;
	}

	toData(): ItemData {
		return {
			id: this.id,
			catalogId: this.catalogId,
			label: this.label,
			x: this.x,
			y: this.y,
			rotation: this.rotation,
			price: this.price,
			...(Object.keys(this.specs).length > 0 ? { specs: $state.snapshot(this.specs) } : {})
		};
	}
}
