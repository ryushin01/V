import type { Underlay } from '#entities/plan';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_EDGE_PX = 2000;

export type LoadedImage = Pick<Underlay, 'src' | 'pixelWidth' | 'pixelHeight'>;

export function validateImageFile(file: Pick<File, 'type' | 'size'>): string | null {
	if (!ACCEPTED.includes(file.type)) return 'JPG, PNG, WebP 이미지만 올릴 수 있습니다.';
	if (file.size > MAX_FILE_BYTES) return '15MB 이하의 이미지를 올려 주세요.';
	return null;
}

/** 브라우저 저장 용량을 아끼기 위해 긴 변을 줄이고 JPEG로 바꿉니다. */
export async function loadImage(file: File): Promise<LoadedImage> {
	const bitmap = await createImageBitmap(file);
	const ratio = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
	const pixelWidth = Math.round(bitmap.width * ratio);
	const pixelHeight = Math.round(bitmap.height * ratio);
	const canvas = document.createElement('canvas');
	canvas.width = pixelWidth;
	canvas.height = pixelHeight;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('이미지를 처리할 수 없습니다.');
	context.fillStyle = '#fff';
	context.fillRect(0, 0, pixelWidth, pixelHeight);
	context.drawImage(bitmap, 0, 0, pixelWidth, pixelHeight);
	bitmap.close();
	return { src: canvas.toDataURL('image/jpeg', 0.82), pixelWidth, pixelHeight };
}
