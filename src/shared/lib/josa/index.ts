const DIGIT_HAS_FINAL = new Set(['0', '1', '3', '6', '7', '8']);
const LETTER_HAS_FINAL = new Set(['L', 'M', 'N', 'R']);

function hasFinalConsonant(word: string): boolean {
	const last = word.trim().slice(-1);
	const code = last.charCodeAt(0);
	if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
	if (DIGIT_HAS_FINAL.has(last)) return true;
	return LETTER_HAS_FINAL.has(last.toUpperCase());
}

/** 단어 끝소리에 맞는 조사를 붙입니다. 예: josa('책상', '이', '가') → '책상이' */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
	return `${word}${hasFinalConsonant(word) ? withFinal : withoutFinal}`;
}
