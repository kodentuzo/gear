// Turns Valibot's issues into our own, so callers never see Valibot's shapes.
// Inside the schemas, every Valibot message is one of our codes.
import type * as v from 'valibot';
import type { Issue } from './result.ts';

type Messages = Record<string, (field: string) => string>;

/** The plain-words message for each code. A schema can add its own. */
const COMMON: Messages = {
	required: (field) => `${field} is required.`,
	unknown_key: (field) => `${field} is not a known field. Check the spelling.`,
	wrong_type: (field) => (field === '' ? 'This must be an object.' : `${field} has the wrong type.`),
	empty: (field) => `${field} must not be empty. Leave the field out instead.`
};

function codeOf(issue: v.BaseIssue<unknown>): string {
	if (issue.type === 'strict_object' || issue.type === 'object') {
		if (issue.expected === 'never') return 'unknown_key';
		if (issue.received === 'undefined') return 'required';
		return 'wrong_type';
	}
	return issue.message;
}

export function toIssues(issues: readonly v.BaseIssue<unknown>[], messages: Messages = {}): Issue[] {
	const seen = new Set<string>();
	const result: Issue[] = [];
	for (const issue of issues) {
		const field = (issue.path ?? []).map((item) => String(item.key)).join('.');
		// One issue per field: the first rule it broke.
		if (seen.has(field)) continue;
		seen.add(field);
		const code = codeOf(issue);
		const message = (messages[code] ?? COMMON[code])?.(field) ?? `${field} is not valid.`;
		result.push({ field, code, message });
	}
	return result;
}

/** True for `{}`-style objects only: not null, not an array. */
export function isPlainObject(input: unknown): input is Record<string, unknown> {
	return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export const NOT_AN_OBJECT: Issue = { field: '', code: 'wrong_type', message: COMMON.wrong_type!('') };
