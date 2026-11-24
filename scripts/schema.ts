// Writes tape.schema.json, the JSON Schema for tape.json, from the one definition
// in src/tape.ts. Editors use it through the "$schema" key.
//
//   pnpm schema
import { writeFile } from 'node:fs/promises';
import { toJsonSchema } from '@valibot/to-json-schema';
import { TapeFileSchema } from '../src/tape.ts';

const schema = {
	...toJsonSchema(TapeFileSchema),
	title: 'tape.json',
	description: 'What an app is called. Read by @kodentuzo/tape.'
};

await writeFile('tape.schema.json', `${JSON.stringify(schema, null, '\t')}\n`);
console.log('Wrote tape.schema.json');
