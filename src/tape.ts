// tape.json: what an app is called. This file holds the one definition of the format.
import * as v from 'valibot';
import { isPlainObject, NOT_AN_OBJECT, toIssues } from './issues.ts';
import type { Result } from './result.ts';

/** The format version this library reads and writes. It changes only on a breaking change. */
export const FORMAT_VERSION = 1;

/** The longest each text field may be, in characters. */
export const LIMITS = { name: 45, short_name: 12, description: 300 } as const;

// A path inside the source, relative to the folder holding tape.json:
// not absolute, no ".." part, no backslashes, and not a URL or a drive letter.
const RELATIVE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?![A-Za-z][A-Za-z0-9+.-]*:)[^\\]+$/;

function text(limit: number) {
	return v.pipe(
		v.string('wrong_type'),
		v.nonEmpty('empty'),
		v.regex(/\S/, 'empty'),
		v.maxLength(limit, 'too_long')
	);
}

/** The fields that describe the app. */
export const tapeEntries = {
	name: text(LIMITS.name),
	short_name: v.exactOptional(text(LIMITS.short_name)),
	description: v.exactOptional(text(LIMITS.description)),
	icon: v.exactOptional(
		v.pipe(v.string('wrong_type'), v.nonEmpty('empty'), v.regex(RELATIVE_PATH, 'invalid_path'))
	)
};

/** The whole file. Unknown keys are an error; `$schema` is the one allowed extra. */
export const TapeFileSchema = v.strictObject({
	$schema: v.exactOptional(v.string('wrong_type')),
	tape: v.literal(FORMAT_VERSION, 'unsupported_version'),
	...tapeEntries
});

const TapeSchema = v.object(tapeEntries);

/** What an app is called. A tape never holds an empty string. */
export type Tape = v.InferOutput<typeof TapeSchema>;

const MESSAGES = {
	too_long: (field: string) =>
		`${field} is too long. The limit is ${LIMITS[field as keyof typeof LIMITS]} characters.`,
	unsupported_version: () => `tape must be ${FORMAT_VERSION}, the format version this library reads.`,
	invalid_path: (field: string) =>
		`${field} must be a path inside the source, relative to tape.json: no leading "/", no "..", not a URL.`
};

/**
 * Checks the parsed contents of a tape.json.
 * Any broken rule fails the whole file, with one issue per problem.
 */
export function parseTape(input: unknown): Result<Tape> {
	if (!isPlainObject(input)) return { ok: false, issues: [NOT_AN_OBJECT] };

	const result = v.safeParse(TapeFileSchema, input);
	if (!result.success) return { ok: false, issues: toIssues(result.issues, MESSAGES) };

	const { $schema: _schema, tape: _version, ...tape } = result.output;
	return { ok: true, value: tape, warnings: [] };
}
