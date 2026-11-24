// Try one of the library's functions on JSON files, by hand:
//
//   pnpm try <function> [file.json ...]
//
// Each file is read as JSON and passed as one argument, in order.
// The file reading lives here, never in the library.
import { readFile } from 'node:fs/promises';
import * as tape from '../src/index.ts';

// Functions that take checked values get them checked first, as a real caller would.
// A file that fails its check is printed as the result.
const recipes: Record<string, (...args: unknown[]) => unknown> = {
	applyOverrides(tapeJson, overridesJson) {
		const parsedTape = tape.parseTape(tapeJson);
		if (!parsedTape.ok) return { failed: 'parseTape', ...parsedTape };
		const parsedOverrides = tape.parseOverrides(overridesJson);
		if (!parsedOverrides.ok) return { failed: 'parseOverrides', ...parsedOverrides };
		return tape.applyOverrides(parsedTape.value, parsedOverrides.value);
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
