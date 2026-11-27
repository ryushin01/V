#!/usr/bin/env node
// CI와 같은 검사를 한 명령으로 돌립니다. CI(.github/workflows/ci.yml)도 이 스크립트를 묶음별로 부릅니다.
//
//   pnpm check              모든 묶음을 차례로(static → build → e2e → perf)
//   pnpm check static e2e   고른 묶음만(e2e·perf는 먼저 build가 있어야 함)
//   pnpm check e2e -- --project=chromium   -로 시작하는 인자는 pnpm test:e2e(Playwright)에 넘깁니다
//
// 하나라도 실패하면 바로 멈추고 실패한 명령을 알려 줍니다. 마지막에 단계별 걸린 시간을 보여 줍니다.
import { spawnSync } from 'node:child_process';

/** @type {Record<string, string[][]>} */
const GROUPS = {
	static: [['format:check'], ['lint'], ['lint:fsd'], ['typecheck'], ['test:coverage']],
	build: [['build'], ['build-storybook']],
	e2e: [['test:e2e']],
	perf: [['size'], ['lhci']]
};

const argv = process.argv.slice(2).filter((arg) => arg !== '--');
const asked = argv.filter((arg) => !arg.startsWith('-'));
const playwrightArgs = argv.filter((arg) => arg.startsWith('-'));
GROUPS.e2e = [['test:e2e', ...playwrightArgs]];
const unknown = asked.filter((name) => !(name in GROUPS));
if (unknown.length) {
	console.error(
		`모르는 묶음: ${unknown.join(', ')} (${Object.keys(GROUPS).join(', ')} 중에서 고릅니다)`
	);
	process.exit(2);
}
const groups = asked.length ? asked : Object.keys(GROUPS);

/** @type {[string, number][]} */
const timings = [];
for (const group of groups) {
	for (const args of GROUPS[group]) {
		const label = `pnpm ${args.join(' ')}`;
		console.log(`\n▶ [${group}] ${label}`);
		const started = Date.now();
		const { status } = spawnSync('pnpm', args, {
			stdio: 'inherit',
			shell: process.platform === 'win32'
		});
		timings.push([label, Date.now() - started]);
		if (status !== 0) {
			console.error(`\n✖ ${label} 실패 (종료 코드 ${status})`);
			process.exit(status ?? 1);
		}
	}
}

console.log('\n✔ 모든 검사 통과');
for (const [label, ms] of timings)
	console.log(`  ${(ms / 1000).toFixed(1).padStart(6)}s  ${label}`);
