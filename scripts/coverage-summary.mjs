#!/usr/bin/env node
// coverage/coverage-summary.json(vitest json-summary)을 Markdown 표로 바꿔 $GITHUB_STEP_SUMMARY에 씁니다.
// 환경 변수가 없으면(로컬) 화면에 찍습니다.
import { appendFile, readFile } from 'node:fs/promises';

/** vite.config.ts의 coverage.thresholds와 같은 로직 계층 파일입니다. */
const LOGIC = [
	'src/entities/plan/model/analysis.ts',
	'src/entities/plan/model/serialize.ts',
	'src/entities/plan/model/guards.ts',
	'src/entities/plan/model/backup.ts',
	'src/entities/plan/api/share-link.ts',
	'src/entities/plan/api/plans-db.ts',
	'src/entities/plan/api/plan-sync.ts'
];

const summary = JSON.parse(await readFile('coverage/coverage-summary.json', 'utf8'));
const cwd = `${process.cwd()}/`;
const metrics = ['statements', 'branches', 'functions', 'lines'];
const cell = (/** @type {{pct: number}} */ m) => `${m.pct.toFixed(1)}%`;
const row = (/** @type {string} */ name, /** @type {Record<string, {pct: number}>} */ data) =>
	`| ${name} | ${metrics.map((key) => cell(data[key])).join(' | ')} |`;

const lines = [
	'## 단위 테스트 커버리지',
	'',
	'| 파일 | 문장 | 분기 | 함수 | 줄 |',
	'| --- | ---: | ---: | ---: | ---: |',
	row('**전체**', summary.total)
];
for (const file of LOGIC) {
	const entry = summary[`${cwd}${file}`] ?? summary[file];
	if (entry) lines.push(row(`\`${file}\``, entry));
}
const text = `${lines.join('\n')}\n`;

if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, text);
else console.log(text);
