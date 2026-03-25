import { registerAbility, registerAbilityCategory } from '@wordpress/abilities';
import { useEffect, useRef } from '@wordpress/element';
import { showComponentAbility } from '../abilities/show-component';
import type { ShowComponentDeps } from '../abilities/show-component/create-callback';

interface AbilitiesDeps {
	showComponent: ShowComponentDeps;
}

// Shared across all component instances to prevent duplicate registration.
let hasRegistered = false;

/**
 * Registers agents-manager abilities via `@wordpress/abilities`.
 */
export default function useAbilitiesRegistration( deps: AbilitiesDeps ): void {
	// Updated every render so the one-time `useEffect` reads fresh values.
	const depsRef = useRef( deps );
	depsRef.current = deps;

	useEffect( () => {
		if ( hasRegistered ) {
			return;
		}
		hasRegistered = true;

		// Abilities to register.
		const abilities = [ showComponentAbility( () => depsRef.current.showComponent ) ];

		// Register category before abilities (required ordering).
		// Uses `big-sky` to match the backend route configuration.
		( async () => {
			try {
				await registerAbilityCategory( 'big-sky', {
					label: 'Big Sky',
					description: 'Big Sky abilities',
				} );
			} catch {
				// Category may already be registered.
			}

			for ( const ability of abilities ) {
				try {
					await registerAbility( ability );
				} catch ( error ) {
					// eslint-disable-next-line no-console
					console.warn( `[AgentsManager] Failed to register ability: ${ ability.name }`, error );
				}
			}
		} )();
	}, [] );
}
