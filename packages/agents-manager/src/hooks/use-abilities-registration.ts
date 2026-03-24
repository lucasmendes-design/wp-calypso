import { registerAbility, registerAbilityCategory } from '@wordpress/abilities';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { showComponentAbility } from '../abilities/show-component';
import useCheckpoint from './use-checkpoint';
import type { ShowComponentDeps } from '../abilities/show-component/create-callback';

interface AbilitiesDeps {
	showComponent: Omit<
		ShowComponentDeps,
		'setCheckpoint' | 'addNewPageToCheckpoint' | 'currentPostId'
	>;
}

// Shared across all component instances to prevent duplicate registration.
let hasRegistered = false;

/**
 * Registers agents-manager abilities via `@wordpress/abilities`.
 */
export default function useAbilitiesRegistration( deps: AbilitiesDeps ): void {
	const { setCheckpoint, addNewPageToCheckpoint } = useCheckpoint();

	const currentPostId = useSelect( ( select ) => {
		return ( select( 'core/editor' ) as { getCurrentPostId?: () => number } )?.getCurrentPostId?.();
	}, [] );

	// Updated every render so the one-time `useEffect` reads fresh values.
	const depsRef = useRef( { deps, setCheckpoint, addNewPageToCheckpoint, currentPostId } );
	depsRef.current = { deps, setCheckpoint, addNewPageToCheckpoint, currentPostId };

	useEffect( () => {
		if ( hasRegistered ) {
			return;
		}
		hasRegistered = true;

		const getShowComponentDeps = (): ShowComponentDeps => ( {
			...depsRef.current.deps.showComponent,
			currentPostId: depsRef.current.currentPostId,
			setCheckpoint: depsRef.current.setCheckpoint,
			addNewPageToCheckpoint: depsRef.current.addNewPageToCheckpoint,
		} );

		// Abilities to register.
		const abilities = [ showComponentAbility( getShowComponentDeps ) ];

		// Register category before abilities (required ordering).
		// Uses `big-sky` to match the backend route configuration.
		( async () => {
			try {
				await registerAbilityCategory( 'big-sky', {
					label: 'Big Sky',
					description: 'Big Sky abilities',
				} );

				for ( const ability of abilities ) {
					await registerAbility( ability );
				}
			} catch {
				// Category or ability may already be registered.
			}
		} )();
	}, [] );
}
