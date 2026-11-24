// Try one of the library's functions on JSON files, by hand:
//
//   pnpm try <function> [file.json ...]
//
// Each file is read as JSON and passed as one argument, in order.
// The file reading lives here, never in the library.
import { readFile } from 'node:fs/promises';
import * as tape from '../src/index.ts';

const [name, ...files] = process.argv.slice(2);
const functions: Record<string, unknown> = { ...tape };
const available = Object.keys(functions).filter((key) => typeof functions[key] === 'function');
const fn = name === undefined ? undefined : functions[name];

if (typeof fn !== 'function') {
	console.error(name === undefined ? 'Usage: pnpm try <function> [file.json ...]' : `No function called "${name}".`);
	console.error(available.length > 0 ? `Available: ${available.join(', ')}` : 'No functions yet.');
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
