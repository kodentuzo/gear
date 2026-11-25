// Reading tape fields from data we do not control: a web manifest, or a cassette that
// was already recorded. Here the length limits are warnings, never errors.
import type { Issue, Result } from './result.ts';
import { LIMITS, type Tape } from './tape.ts';

type TextField = keyof typeof LIMITS;

/**
 * Takes name, short name and description from an object.
 * Fails only without a usable name. An optional field with the wrong type is left out
 * with a warning; a value over its limit is kept with a warning.
 */
export function readTextFields(input: Record<string, unknown>): Result<Tape> {
	const warnings: Issue[] = [];

	const read = (field: TextField): string | undefined => {
		const value = input[field];
		if (value === undefined || value === null) return undefined;
		if (typeof value !== 'string') {
			warnings.push({ field, code: 'wrong_type', message: `${field} is not text, so it was left out.` });
			return undefined;
		}
		const text = value.trim();
		if (text === '') return undefined;
		if (text.length > LIMITS[field]) {
			warnings.push({
				field,
				code: 'too_long',
				message: `${field} is longer than the recommended ${LIMITS[field]} characters.`
			});
		}
		return text;
	};

	const name = read('name');
	if (name === undefined) {
		const wrongType = warnings.some((warning) => warning.field === 'name');
		return {
			ok: false,
			issues: [
				wrongType
					? { field: 'name', code: 'wrong_type', message: 'name has the wrong type.' }
					: { field: 'name', code: 'required', message: 'name is required.' }
			]
		};
	}

	const short_name = read('short_name');
	const description = read('description');
	return {
		ok: true,
		value: {
			name,
			...(short_name === undefined ? {} : { short_name }),
			...(description === undefined ? {} : { description })
		},
		warnings
	};
}
