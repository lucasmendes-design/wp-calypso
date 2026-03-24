/**
 * Whether AM decoupled abilities are enabled via `?enable-am-abilities=true`.
 */
export default function isAmAbilitiesEnabled(): boolean {
	return new URLSearchParams( window.location.search ).get( 'enable-am-abilities' ) === 'true';
}
