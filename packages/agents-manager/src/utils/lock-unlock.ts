/**
 * Opt-in to WordPress private/unstable APIs via `@wordpress/private-apis`.
 *
 * Required to access private dispatchers like `setZoomLevel` and
 * `resetZoomLevel` from `@wordpress/block-editor`.
 */
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

export const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/edit-site'
);
