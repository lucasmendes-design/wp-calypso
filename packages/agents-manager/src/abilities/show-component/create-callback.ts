import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch } from '@wordpress/data';
import { zoomOut } from '../../utils/canvas-zoom';
import { unlock } from '../../utils/lock-unlock';
import { CHECKPOINT_KEYS } from './index';
import type { ShowComponentCallback, ShowComponentInput } from './index';
import type { AbilityResult } from '../types';

/**
 * Dependencies provided by the host (e.g., `orchestrator-chat`).
 */
export interface ShowComponentDeps {
	/** The current post ID from the editor. */
	currentPostId?: number;
	/** Get the map of compressed client IDs to real block client IDs. */
	getClientIdMap: () => Record< string, string >;
	/** Set a checkpoint so the action can be undone. */
	setCheckpoint: ( id: string, keys: string[] ) => void;
	/** Register a new page in the checkpoint for undo. */
	addNewPageToCheckpoint: ( pageId: string ) => void;
	/** Whether a site is currently being built. Blocks double-click during zoom-out. */
	isBuildingSite?: boolean;
}

/**
 * Creates the `show-component` ability callback.
 * Returns a JSON `agentMessage` for `convertToolMessagesToComponents()`.
 */
export function createCallback( deps: ShowComponentDeps ): ShowComponentCallback {
	return async ( input: ShowComponentInput ): Promise< AbilityResult > => {
		const {
			type,
			props: inputProps = {},
			followUpTasks,
			zoomOut: shouldZoomOut = false,
			clientId,
			messageId,
			insertIndex,
		} = input;

		// Shallow copy to avoid mutating the caller's object.
		const props = { ...inputProps };

		try {
			if ( typeof props !== 'object' || Object.keys( props ).length === 0 ) {
				throw new Error( 'Props must be an object with properties' );
			}

			if ( shouldZoomOut ) {
				const { setZoomLevel } = unlock( dispatch( blockEditorStore ) );
				const { __unstableSetEditorMode } = dispatch( blockEditorStore );
				await zoomOut(
					{ setZoomLevel, __unstableSetEditorMode },
					{ blockDoubleClick: deps.isBuildingSite }
				);
			}

			// Resolve compressed `clientId` to real block client ID.
			const clientIdMap = deps.getClientIdMap();
			if ( clientId && clientIdMap[ clientId ] ) {
				props.clientId = clientIdMap[ clientId ];
			}
			if ( insertIndex !== undefined && insertIndex >= 0 ) {
				props.insertIndex = insertIndex;
			}

			const currentPostId = deps.currentPostId;

			// Set checkpoint so the action can be undone.
			if ( messageId ) {
				const checkpointKey =
					type === 'pattern-picker' && props?.newPageId ? 'page' : CHECKPOINT_KEYS[ type ];
				deps.setCheckpoint( messageId, [ checkpointKey ] );

				if ( type === 'pattern-picker' && props?.newPageId ) {
					deps.addNewPageToCheckpoint( props.newPageId as string );
				}
			}

			return {
				result: 'Component displayed successfully',
				returnToAgent: false,
				agentMessage: JSON.stringify( {
					// Uses `big_sky__` prefix to match `convertToolMessagesToComponents()`.
					tool_id: 'big_sky__show_component',
					data: {
						type,
						props,
						followUpTasks,
						isCurrent: true,
						postId: currentPostId,
						calypsoCheckpointId: messageId,
					},
				} ),
			};
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( `[AgentsManager] Error showing component ${ type }:`, error );

			return {
				result: 'There was an error with this request.',
				returnToAgent: !! followUpTasks,
			};
		}
	};
}
