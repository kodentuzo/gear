// @kodentuzo/tape: read, check and write tape.json.
// Pure functions only: nothing here reads files, the network or settings.
export type { Issue, Result } from './result.ts';
export { FORMAT_VERSION, LIMITS, parseTape } from './tape.ts';
export type { Tape } from './tape.ts';
export { OVERRIDABLE, applyOverrides, parseOverrides } from './overrides.ts';
export type { Overrides } from './overrides.ts';
export { fromWebManifest, toWebManifest } from './manifest.ts';
export type { ManifestAssets, ManifestIcon, WebManifest } from './manifest.ts';
export { LABEL, fromLabels, toLabels } from './labels.ts';
export type { Origin } from './labels.ts';
