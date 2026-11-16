/** 파일을 내려받습니다. 다운로드가 비동기로 시작하는 브라우저를 위해 주소 해제를 미룹니다. */
export function downloadBlob(filename: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** 글자를 파일로 내려받습니다. */
export function downloadText(filename: string, text: string, type = 'application/json'): void {
	downloadBlob(filename, new Blob([text], { type }));
}

export type TextFileResult = { ok: true; text: string } | { ok: false; error: string };

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;

/**
 * 사용자가 고른 파일을 글자로 읽습니다. 한도보다 크면 읽지 않아(아주 큰 파일로 탭이 멈추지 않게) 이유를
 * 돌려주고, 읽다가 실패해도(파일을 옮기거나 지운 경우 등) 던지지 않고 이유를 돌려줍니다.
 */
export async function readTextFile(file: File, maxBytes: number): Promise<TextFileResult> {
	if (file.size > maxBytes) {
		return {
			ok: false,
			error: `파일이 너무 큽니다(${megabytes(file.size)}). ${megabytes(maxBytes)} 이하의 파일을 골라 주세요.`
		};
	}
	try {
		return { ok: true, text: await file.text() };
	} catch {
		return { ok: false, error: '파일을 읽지 못했습니다. 파일을 다시 골라 주세요.' };
	}
}
