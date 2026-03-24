import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import deepmerge from 'deepmerge';
import type { ColorVariation } from '../components/styles-preview';

/**
 * Applies a color variation to the editor's global styles.
 */
export default function useApplyColorVariation() {
	const { globalStylesId, currentRecord } = useSelect( ( select ) => {
		const core = select( coreStore ) as {
			__experimentalGetCurrentGlobalStylesId: () => string;
			getEditedEntityRecord: (
				kind: string,
				name: string,
				key: string
			) => Record< string, unknown >;
		};
		const id = core.__experimentalGetCurrentGlobalStylesId();

		return {
			globalStylesId: id,
			currentRecord: id ? core.getEditedEntityRecord( 'root', 'globalStyles', id ) : null,
		};
	}, [] );

	const { editEntityRecord } = useDispatch( coreStore );

	return useCallback(
		( variation: ColorVariation ) => {
			if ( ! globalStylesId || ! currentRecord ) {
				return;
			}

			const merged = {
				settings: variation.settings
					? deepmerge( currentRecord.settings || {}, variation.settings, {
							arrayMerge: ( _: unknown[], src: unknown[] ) => src,
					  } )
					: currentRecord.settings,
				styles: variation.styles
					? deepmerge( currentRecord.styles || {}, variation.styles, {
							arrayMerge: ( _: unknown[], src: unknown[] ) => src,
					  } )
					: currentRecord.styles,
			};

			editEntityRecord( 'root', 'globalStyles', globalStylesId, merged );
		},
		[ globalStylesId, currentRecord, editEntityRecord ]
	);
}
