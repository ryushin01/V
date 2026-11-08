import type { Meta } from '@storybook/sveltekit';
import { CATALOG } from '../model/catalog';
import Gallery from './ItemGlyphGallery.svelte';

const meta = { title: 'entities/plan/ItemGlyph', component: Gallery } satisfies Meta<
	typeof Gallery
>;

export default meta;

export const AllItems = { args: { entries: CATALOG } };
