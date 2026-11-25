// Try one of the library's functions on JSON files, by hand:
//
//   pnpm try <function> [file.json ...]
//
// Each file is read as JSON and passed as one argument, in order.
// The file reading lives here, never in the library.
import { readFile } from 'node:fs/promises';
import * as tape from '../src/index.ts';

// A made-up source and commit, standing in for what a recorder knows.
const SAMPLE_ORIGIN = {
	source: 'https://github.com/example/sokoban',
	revision: '0123456789abcdef0123456789abcdef01234567'
};

// Functions that take checked values get them checked first, as a real caller would.
// A file that fails its check is printed as the result.
const recipes: Record<string, (...args: unknown[]) => unknown> = {
	applyOverrides(tapeJson, overridesJson) {
		const parsedTape = tape.parseTape(tapeJson);
		if (!parsedTape.ok) return { failed: 'parseTape', ...parsedTape };
		const parsedOverrides = tape.parseOverrides(overridesJson);
		if (!parsedOverrides.ok) return { failed: 'parseOverrides', ...parsedOverrides };
		return tape.applyOverrides(parsedTape.value, parsedOverrides.value);
	},
	toWebManifest(tapeJson, assetsJson) {
		const parsedTape = tape.parseTape(tapeJson);
		if (!parsedTape.ok) return { failed: 'parseTape', ...parsedTape };
		return tape.toWebManifest(parsedTape.value, (assetsJson ?? {}) as tape.ManifestAssets);
	},
	// The labels a recorder would write: the tape with its overrides applied, and a sample origin.
	toLabels(tapeJson, overridesJson) {
		const parsedTape = tape.parseTape(tapeJson);
		if (!parsedTape.ok) return { failed: 'parseTape', ...parsedTape };
		const parsedOverrides = tape.parseOverrides(overridesJson ?? {});
		if (!parsedOverrides.ok) return { failed: 'parseOverrides', ...parsedOverrides };
		const merged = tape.applyOverrides(parsedTape.value, parsedOverrides.value);
		return tape.toLabels(merged, { ...SAMPLE_ORIGIN, overrides: parsedOverrides.value });
	},
	// Writes the labels, then reads them back.
	roundtrip(tapeJson, overridesJson) {
		const labels = recipes.toLabels!(tapeJson, overridesJson);
		if (typeof labels !== 'object' || labels === null || 'failed' in labels) return labels;
		return { labels, read: tape.fromLabels(labels) };
	}
};

const [name, ...files] = process.argv.slice(2);
const functions: Record<string, unknown> = { ...tape, ...recipes };
const available = Object.keys(functions).filter((key) => typeof functions[key] === 'function');
const fn = name === undefined ? undefined : functions[name];

if (typeof fn !== 'function') {
	console.error(name === undefined ? 'Usage: pnpm try <function> [file.json ...]' : `No function called "${name}".`);
	console.error(`Available: ${available.join(', ')}`);
	process.exit(1);
}

const args: unknown[] = [];
for (const file of files) {
	const text = await readFile(file, 'utf8');
	try {
		args.push(JSON.parse(text));
	} catch {
		console.error(`${file} is not valid JSON.`);
		process.exit(1);
	}
}

console.log(JSON.stringify(fn(...args), null, 2));
