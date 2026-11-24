// What every checking function returns. Nothing in this library throws for bad input.

/** One thing that was wrong, or worth a warning. */
export type Issue = {
	/** The field it is about, such as `name`. Empty when it is about the whole input. */
	field: string;
	/** A short, stable name for the problem, such as `too_long`. Safe to match on. */
	code: string;
	/** The problem in plain words. */
	message: string;
};

/** Either a valid value, possibly with warnings, or the list of what was wrong. */
export type Result<T> =
	| { ok: true; value: T; warnings: Issue[] }
	| { ok: false; issues: Issue[] };
