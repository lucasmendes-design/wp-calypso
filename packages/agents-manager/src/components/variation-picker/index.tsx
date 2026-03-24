import {
	Button,
	__experimentalGrid as Grid,
	Tooltip,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import Variation from '../variation';
import type { ColorVariation, GlobalStyles, PaletteColor } from '../styles-preview';
import './style.scss';

const prepareVariations = (
	variations: ColorVariation[],
	numSuggestions: number
): ColorVariation[] => {
	const preparedVariations = variations.filter( ( v ) => v );
	if ( numSuggestions > 0 ) {
		return [ ...preparedVariations.slice( 0, numSuggestions ) ];
	}
	return preparedVariations;
};

const sliceVariations = (
	variations: ColorVariation[],
	start: number,
	count: number
): ColorVariation[] => {
	return variations.slice( start, start + count );
};

interface Props {
	variations: ColorVariation[];
	maxToShow?: number;
	type: 'color' | 'font' | 'button';
	numSuggestions?: number;
	onSelect: ( variation: ColorVariation ) => void;
	onPaginate?: ( direction: 'prev' | 'next' ) => void;
	activeVariationTitle?: string | null;
	globalStyles: GlobalStyles;
	paletteColors: PaletteColor[];
	themeColors: PaletteColor[];
	currentColorVariation?: ColorVariation | null;
	fontFamiliesToCSS?: ( fontFamilies: Array< { name: string; fontFamily: string } > ) => string;
}

export default function VariationPicker( {
	variations,
	maxToShow = 4,
	type,
	numSuggestions = 0,
	onSelect,
	onPaginate,
	activeVariationTitle,
	globalStyles,
	paletteColors,
	themeColors,
	currentColorVariation,
	fontFamiliesToCSS,
}: Props ) {
	const [ variationsToShow, setVariationsToShow ] = useState< ColorVariation[] >( [] );
	const [ firstIndex, setFirstIndex ] = useState( 0 );

	const sortedVariations = useMemo(
		() => prepareVariations( variations, numSuggestions ),
		[ variations, numSuggestions ]
	);

	const totalPages = useMemo( () => {
		if ( ! sortedVariations || sortedVariations.length === 0 ) {
			return 0;
		}
		return Math.ceil( sortedVariations.length / maxToShow );
	}, [ sortedVariations, maxToShow ] );

	const currentPage = useMemo( () => {
		return Math.floor( firstIndex / maxToShow ) + 1;
	}, [ firstIndex, maxToShow ] );

	useEffect( () => {
		if ( ! sortedVariations ) {
			return;
		}

		const initialVariations = sliceVariations( sortedVariations, 0, maxToShow );
		setVariationsToShow( initialVariations );
	}, [ maxToShow, sortedVariations ] );

	const revealPrevious = () => {
		onPaginate?.( 'prev' );
		const nextFirstIndex = Math.max( 0, firstIndex - maxToShow );
		setFirstIndex( nextFirstIndex );
		setVariationsToShow( sliceVariations( sortedVariations, nextFirstIndex, maxToShow ) );
	};

	const revealNext = () => {
		onPaginate?.( 'next' );
		const nextFirstIndex = Math.min(
			firstIndex + maxToShow,
			Math.floor( sortedVariations.length / maxToShow ) * maxToShow
		);
		setFirstIndex( nextFirstIndex );
		setVariationsToShow( sliceVariations( sortedVariations, nextFirstIndex, maxToShow ) );
	};

	if ( sortedVariations && sortedVariations.length === 0 ) {
		return (
			<div>
				{ __(
					'There was a problem retrieving options. Please try again.',
					'__i18n_text_domain__'
				) }
			</div>
		);
	}

	return (
		<div className="agents-manager__variation-picker picker-component">
			{ variationsToShow && variationsToShow.length > 0 && (
				<VStack spacing={ 1 }>
					<Grid gap={ 2 } columns={ 2 } className="agents-manager__variation-picker-grid">
						{ variationsToShow.map( ( variation, index ) => (
							<Tooltip key={ index } text={ type === 'font' ? variation.title : '' }>
								<div>
									<Variation
										variation={ variation }
										type={ type }
										isActive={ variation.title === activeVariationTitle }
										onSelect={ onSelect }
										globalStyles={ globalStyles }
										paletteColors={ paletteColors }
										themeColors={ themeColors }
										currentColorVariation={ currentColorVariation }
										fontFamiliesToCSS={ fontFamiliesToCSS }
									/>
								</div>
							</Tooltip>
						) ) }
					</Grid>
					{ sortedVariations.length > maxToShow && (
						<div className="agents-manager__variation-picker-arrows">
							<Button
								label={ __( 'Previous', '__i18n_text_domain__' ) }
								size="compact"
								icon={ chevronLeft }
								onClick={ revealPrevious }
								disabled={ firstIndex === 0 }
							/>
							<div className="agents-manager__variation-picker-pager">
								{ currentPage }/{ totalPages }
							</div>
							<Button
								label={ __( 'Next', '__i18n_text_domain__' ) }
								size="compact"
								icon={ chevronRight }
								onClick={ revealNext }
								disabled={ firstIndex + maxToShow >= sortedVariations.length }
							/>
						</div>
					) }
				</VStack>
			) }
		</div>
	);
}
