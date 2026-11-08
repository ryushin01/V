import type { Meta } from '@storybook/sveltekit';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

const meta = { title: 'shared/Button', component: Button } satisfies Meta<typeof Button>;

export default meta;

export const Primary = { args: { variant: 'primary', children: label('새 배치도') } };
export const Ghost = { args: { variant: 'ghost', children: label('불러오기') } };
export const Danger = { args: { variant: 'danger', children: label('삭제') } };
export const Disabled = { args: { disabled: true, children: label('되돌리기') } };
