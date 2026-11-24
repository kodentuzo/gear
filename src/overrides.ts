// Overrides: the fields of a tape that Studio may change for the next recording.
import * as v from 'valibot';
import { isPlainObject, NOT_AN_OBJECT, toIssues } from './issues.ts';
import type { Result } from './result.ts';
import { LIMITS, type Tape } from './tape.ts';

/** The fields that can be overridden. The icon is a file, so it changes only by commit. */
export const OVERRIDABLE = ['name', 'short_name', 'description'] as const;

type Overridable = (typeof OVERRIDABLE)[number];

/**
 * A project's changes to a tape.
 * `null` or absent: use the default. `""`: remove an optional field.
 * `""` for `name` is an error, since a tape must have a name.
 */
export type Overrides = Partial<Record<Overridable, string | null>>;

// Text that may also be "", meaning "remove this field". Only spaces is still an error.
function removableText(limit: number) {
	return v.pipe(v.string('wrong_type'), v.regex(/^$|\S/, 'blank'), v.maxLength(limit, 'too_long'));
}

function requiredText(limit: number) {
	return v.pipe(v.string('wrong_type'), v.regex(/\S/, 'empty'), v.maxLength(limit, 'too_long'));
}

const OverridesSchema = v.strictObject({
	name: v.exactOptional(v.nullable(requiredText(LIMITS.name))),
	short_name: v.exactOptional(v.nullable(removableText(LIMITS.short_name))),
	description: v.exactOptional(v.nullable(removableText(LIMITS.description)))
} satisfies Record<Overridable, unknown>);

const MESSAGES = {
	too_long: (field: string) =>
		`${field} is too long. The limit is ${LIMITS[field as Overridable]} characters.`,
	empty: (field: string) =>
		`${field} is required and cannot be removed. Use null to go back to the default.`,
	blank: (field: string) => `${field} must not be only spaces. Use "" to remove it.`
};

/**
 * Checks overrides, with the same limits as tape.json.
 * The value has nulls stripped, so it records only what is overridden.
 */
export function parseOverrides(input: unknown): Result<Overrides> {
	if (!isPlainObject(input)) return { ok: false, issues: [NOT_AN_OBJECT] };

	const result = v.safeParse(OverridesSchema, input);
	if (!result.success) {
		const issues = toIssues(result.issues, MESSAGES).map((issue) =>
			issue.code === 'unknown_key'
				? {
						...issue,
						code: 'not_overridable',
						message: `${issue.field} cannot be overridden. Only ${OVERRIDABLE.join(', ')} can.`
					}
				: issue
		);
		return { ok: false, issues };
	}

	const value: Overrides = {};
	for (const key of OVERRIDABLE) {
		const override = result.output[key];
		if (override !== undefined && override !== null) value[key] = override;
	}
	return { ok: true, value, warnings: [] };
}

/**
 * Lays overrides over a tape and returns a new tape. Neither argument is changed.
 * Both must come from `parseTape` and `parseOverrides`; the types cannot enforce it.
 */
export function applyOverrides(tape: Tape, overrides: Overrides): Tape {
	const name = overrides.name ?? tape.name;
	const short_name = overrides.short_name ?? tape.short_name;
	const description = overrides.description ?? tape.description;

	// Built in a fixed order, and "" means the field is removed.
	return {
		name: name === '' ? tape.name : name,
		...(short_name ? { short_name } : {}),
		...(description ? { description } : {}),
		...(tape.icon === undefined ? {} : { icon: tape.icon })
	};
}
