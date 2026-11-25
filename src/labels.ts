// Cassette labels: how a tape and where it came from travel on an image.
import { isPlainObject, NOT_AN_OBJECT } from './issues.ts';
import { readTextFields } from './lenient.ts';
import { OVERRIDABLE, type Overrides } from './overrides.ts';
import type { Issue, Result } from './result.ts';
import { FORMAT_VERSION, RELATIVE_PATH, type Tape } from './tape.ts';

/**
 * The one label this library reads. Its value is a JSON string holding the format
 * version, the tape and its origin.
 */
export const LABEL = 'com.kodentuzo.tape';

/** Where a cassette came from: the source, the commit, and the overrides applied. */
export type Origin = { source?: string; revision?: string; overrides?: Overrides };

// JSON with object keys sorted, so the same data always gives the same string.
function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
	if (isPlainObject(value)) {
		const keys = Object.keys(value)
			.filter((key) => value[key] !== undefined)
			.sort();
		return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
	}
	return JSON.stringify(value);
}

function overridesOf(overrides: Overrides | undefined): Overrides | undefined {
	const kept: Overrides = {};
	for (const key of OVERRIDABLE) {
		const value = overrides?.[key];
		if (value !== undefined && value !== null) kept[key] = value;
	}
	return Object.keys(kept).length === 0 ? undefined : kept;
}

/**
 * The labels to put on a cassette. The tape is the final one, with overrides already
 * applied; it must come from this library.
 * Deterministic: the same input gives the same keys and the same strings.
 * The `org.opencontainers.image.*` keys are courtesy copies for other tools.
 */
export function toLabels(tape: Tape, origin: Origin = {}): Record<string, string> {
	const overrides = overridesOf(origin.overrides);
	const payload = {
		version: FORMAT_VERSION,
		tape: {
			name: tape.name,
			short_name: tape.short_name,
			description: tape.description,
			icon: tape.icon
		},
		origin: { source: origin.source, revision: origin.revision, overrides }
	};

	return {
		[LABEL]: stableJson(payload),
		...(tape.description === undefined ? {} : { 'org.opencontainers.image.description': tape.description }),
		...(origin.revision === undefined ? {} : { 'org.opencontainers.image.revision': origin.revision }),
		...(origin.source === undefined ? {} : { 'org.opencontainers.image.source': origin.source }),
		'org.opencontainers.image.title': tape.name
	};
}

function fail(field: string, code: string, message: string): { ok: false; issues: Issue[] } {
	return { ok: false, issues: [{ field, code, message }] };
}

/**
 * Reads a cassette's labels back. Only the `com.kodentuzo.tape` label is read; the
 * `org.opencontainers.image.*` keys are ignored, since other build tools rewrite them.
 * Length limits are warnings, so a cassette already recorded is never refused for length.
 * A format version newer than this library's is refused.
 */
export function fromLabels(labels: unknown): Result<{ tape: Tape; origin: Origin }> {
	if (!isPlainObject(labels)) return { ok: false, issues: [NOT_AN_OBJECT] };

	const raw = labels[LABEL];
	if (raw === undefined) {
		return fail(LABEL, 'no_label', `There is no ${LABEL} label, so this image was not recorded as a cassette.`);
	}
	if (typeof raw !== 'string') return fail(LABEL, 'wrong_type', `${LABEL} has the wrong type.`);

	let payload: unknown;
	try {
		payload = JSON.parse(raw);
	} catch {
		return fail(LABEL, 'invalid_json', `${LABEL} does not hold valid JSON.`);
	}
	if (!isPlainObject(payload)) return fail(LABEL, 'wrong_type', `${LABEL} must hold an object.`);

	const version = payload.version;
	if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
		return fail('version', 'invalid_version', 'version must be a whole number, 1 or more.');
	}
	if (version > FORMAT_VERSION) {
		return fail(
			'version',
			'unsupported_version',
			`This cassette was recorded with format version ${version}. This library reads up to ${FORMAT_VERSION}.`
		);
	}

	if (!isPlainObject(payload.tape)) return fail('tape', 'wrong_type', 'tape must be an object.');
	const text = readTextFields(payload.tape);
	if (!text.ok) return text;
	const warnings = [...text.warnings];

	// The icon path is used to fetch a file from the source, so a path that could
	// point outside it is dropped, not trusted.
	const icon = payload.tape.icon;
	let keptIcon: string | undefined;
	if (typeof icon === 'string' && RELATIVE_PATH.test(icon)) keptIcon = icon;
	else if (icon !== undefined && icon !== null) {
		warnings.push({ field: 'icon', code: 'invalid_path', message: 'icon is not a path inside the source, so it was left out.' });
	}

	const origin: Origin = {};
	const rawOrigin = isPlainObject(payload.origin) ? payload.origin : {};
	for (const key of ['source', 'revision'] as const) {
		const value = rawOrigin[key];
		if (typeof value === 'string' && value !== '') origin[key] = value;
		else if (value !== undefined && value !== null) {
			warnings.push({ field: `origin.${key}`, code: 'wrong_type', message: `origin.${key} is not text, so it was left out.` });
		}
	}
	if (isPlainObject(rawOrigin.overrides)) {
		const overrides: Overrides = {};
		for (const key of OVERRIDABLE) {
			const value = rawOrigin.overrides[key];
			if (typeof value === 'string') overrides[key] = value;
		}
		if (Object.keys(overrides).length > 0) origin.overrides = overrides;
	}

	return {
		ok: true,
		value: { tape: { ...text.value, ...(keptIcon === undefined ? {} : { icon: keptIcon }) }, origin },
		warnings
	};
}
