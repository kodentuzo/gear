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

/** One entry of a manifest's `icons`: a file the app serves. */
export type ManifestIcon = { src: string; sizes: string; type?: string; purpose?: string };

/**
 * What a manifest needs that a tape does not hold. The caller made these:
 * the colors come from the app's theme and the icons are generated files.
 */
export type ManifestAssets = {
	/** As `#rrggbb`. */
	theme_color?: string;
	/** As `#rrggbb`. */
	background_color?: string;
	icons?: readonly ManifestIcon[];
};

/** A web manifest, as this library writes it. */
export type WebManifest = {
	name: string;
	short_name: string;
	description?: string;
	start_url: '/';
	scope: '/';
	display: 'standalone';
	theme_color?: string;
	background_color?: string;
	icons?: ManifestIcon[];
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function hex(color: string | undefined): string | undefined {
	return color !== undefined && HEX_COLOR.test(color) ? color.toLowerCase() : undefined;
}

/**
 * Writes a web manifest from a tape. The tape must come from this library.
 * `short_name` falls back to `name`. A color that is not `#rrggbb` is left out.
 * No address is needed: `start_url` and `scope` are relative.
 */
export function toWebManifest(tape: Tape, assets: ManifestAssets = {}): WebManifest {
	const theme_color = hex(assets.theme_color);
	const background_color = hex(assets.background_color);
	const icons = (assets.icons ?? []).map((icon) => ({
		src: icon.src,
		sizes: icon.sizes,
		...(icon.type === undefined ? {} : { type: icon.type }),
		...(icon.purpose === undefined ? {} : { purpose: icon.purpose })
	}));

	return {
		name: tape.name,
		short_name: tape.short_name ?? tape.name,
		...(tape.description === undefined ? {} : { description: tape.description }),
		start_url: '/',
		scope: '/',
		display: 'standalone',
		...(theme_color === undefined ? {} : { theme_color }),
		...(background_color === undefined ? {} : { background_color }),
		...(icons.length === 0 ? {} : { icons })
	};
}
