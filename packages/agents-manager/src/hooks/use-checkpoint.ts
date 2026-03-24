import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';

/**
 * Editor state snapshot stored at each checkpoint by `useCheckpoint`.
 */
interface CheckpointState {
	checkpointKeys: string[];
	globalStylesSettings?: Record< string, unknown >;
	globalStylesStyles?: Record< string, unknown >;
	newPageId?: string;
	pageRename?: { pageId: string; oldTitle: string; newTitle: string };
	pageRemoval?: { pageId: string; pageTitle: string; shouldRestoreNavigation?: boolean };
	[ key: string ]: unknown;
}

/**
 * Return type of the `useCheckpoint` hook.
 */
export interface UseCheckpointReturn {
	getLastEditorState: () => CheckpointState | undefined;
	setCheckpoint: ( id: string, keys?: string[] ) => void;
	addCheckpointKeys: ( id: string, keys: string[] ) => void;
	restoreCheckpoint: ( id: string ) => Promise< void >;
	addNewPageToCheckpoint: ( pageId: string ) => void;
	addPageRenameToCheckpoint: ( pageId: string, oldTitle: string, newTitle: string ) => void;
	addPageRemovalToCheckpoint: (
		pageId: string,
		pageTitle: string,
		options?: { shouldRestoreNavigation?: boolean }
	) => void;
	clearCheckpoint: ( id: string ) => void;
	hasCheckpoint: ( id: string ) => boolean;
}

/**
 * Saves and restores global styles snapshots so that AI actions can be undone.
 */
export default function useCheckpoint(): UseCheckpointReturn {
	const checkpoints = useRef( new Map< string, CheckpointState >() );

	const { globalStylesId, getEditedEntityRecord } = useSelect( ( select ) => {
		const core = select( coreStore ) as {
			__experimentalGetCurrentGlobalStylesId: () => string;
			getEditedEntityRecord: (
				kind: string,
				name: string,
				key: string
			) => Record< string, unknown >;
		};
		return {
			globalStylesId: core.__experimentalGetCurrentGlobalStylesId(),
			getEditedEntityRecord: core.getEditedEntityRecord,
		};
	}, [] );

	const { editEntityRecord } = useDispatch( coreStore );

	/** Merge partial data into the last `CheckpointState` entry. */
	const updateLastCheckpoint = useCallback( ( patch: Partial< CheckpointState > ) => {
		const entries = Array.from( checkpoints.current.entries() );
		if ( entries.length > 0 ) {
			const [ lastId, lastState ] = entries[ entries.length - 1 ];
			checkpoints.current.set( lastId, { ...lastState, ...patch } );
		}
	}, [] );

	const setCheckpoint = useCallback(
		( id: string, keys: string[] = [] ) => {
			if ( ! id || ! globalStylesId ) {
				return;
			}
			const record = getEditedEntityRecord( 'root', 'globalStyles', globalStylesId );
			const copy = record ? JSON.parse( JSON.stringify( record ) ) : {};
			checkpoints.current.set( id, {
				checkpointKeys: keys,
				globalStylesSettings: copy.settings,
				globalStylesStyles: copy.styles,
			} );
		},
		[ globalStylesId, getEditedEntityRecord ]
	);

	const restoreCheckpoint = useCallback(
		async ( id: string ) => {
			const state = checkpoints.current.get( id );
			if ( ! state || ! globalStylesId ) {
				return;
			}
			if ( state.globalStylesSettings || state.globalStylesStyles ) {
				await editEntityRecord( 'root', 'globalStyles', globalStylesId, {
					settings: state.globalStylesSettings || {},
					styles: state.globalStylesStyles || {},
				} );
			}
		},
		[ globalStylesId, editEntityRecord ]
	);

	const getLastEditorState = useCallback( () => {
		const entries = Array.from( checkpoints.current.entries() );
		return entries.length > 0 ? entries[ entries.length - 1 ][ 1 ] : undefined;
	}, [] );

	const addCheckpointKeys = useCallback( ( id: string, keys: string[] ) => {
		const existing = checkpoints.current.get( id );
		if ( existing ) {
			checkpoints.current.set( id, {
				...existing,
				checkpointKeys: [ ...new Set( [ ...existing.checkpointKeys, ...keys ] ) ],
			} );
		}
	}, [] );

	const addNewPageToCheckpoint = useCallback(
		( pageId: string ) => updateLastCheckpoint( { newPageId: pageId } ),
		[ updateLastCheckpoint ]
	);

	const addPageRenameToCheckpoint = useCallback(
		( pageId: string, oldTitle: string, newTitle: string ) =>
			updateLastCheckpoint( { pageRename: { pageId, oldTitle, newTitle } } ),
		[ updateLastCheckpoint ]
	);

	const addPageRemovalToCheckpoint = useCallback(
		( pageId: string, pageTitle: string, options?: { shouldRestoreNavigation?: boolean } ) =>
			updateLastCheckpoint( {
				pageRemoval: {
					pageId,
					pageTitle,
					shouldRestoreNavigation: options?.shouldRestoreNavigation,
				},
			} ),
		[ updateLastCheckpoint ]
	);

	const clearCheckpoint = useCallback( ( id: string ) => checkpoints.current.delete( id ), [] );

	const hasCheckpoint = useCallback(
		( id: string ) => !! checkpoints.current.get( id )?.checkpointKeys?.length,
		[]
	);

	return {
		getLastEditorState,
		setCheckpoint,
		addCheckpointKeys,
		restoreCheckpoint,
		addNewPageToCheckpoint,
		addPageRenameToCheckpoint,
		addPageRemovalToCheckpoint,
		clearCheckpoint,
		hasCheckpoint,
	};
}
