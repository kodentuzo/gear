// The web manifest: the file a browser reads to install a web app.
import { isPlainObject, NOT_AN_OBJECT } from './issues.ts';
import { readTextFields } from './lenient.ts';
import type { Result } from './result.ts';
import type { Tape } from './tape.ts';

/**
 * Makes a tape from a parsed web manifest: the fallback for a source with no tape.json.
 * Takes name, short name and description only. Colors belong to the theme, and a
 * manifest's icons point at served files, not at a file in the source.
 * The manifest standard sets no length limits, so ours are warnings here.
 */
export function fromWebManifest(input: unknown): Result<Tape> {
	if (!isPlainObject(input)) return { ok: false, issues: [NOT_AN_OBJECT] };
	return readTextFields(input);
}
