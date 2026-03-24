import { useEffect, useState } from '@wordpress/element';
import VariationPicker from '../variation-picker';
import type { ColorVariation, GlobalStyles, PaletteColor } from '../styles-preview';

enum PaletteType {
	Bold = 'Bold',
	BoldText = 'BoldText',
	BoldDark = 'BoldDark',
	Sophisticated = 'Sophisticated',
	SophisticatedDark = 'SophisticatedDark',
	Playful = 'Playful',
	PlayfulQuirky = 'PlayfulQuirky',
	Pastel = 'Pastel',
}

interface CreateCurrentColorVariationParams {
	colorVariations: ColorVariation[];
	currentColorMeta: string | null;
	customVariationTemplates: GlobalStyles[];
	currentPaletteColors: PaletteColor[];
	currentTheme: GlobalStyles | null;
}

const createCurrentColorVariation = ( {
	colorVariations,
	currentColorMeta: currentVariation,
	customVariationTemplates,
	currentPaletteColors,
	currentTheme,
}: CreateCurrentColorVariationParams ): ColorVariation | null => {
	if ( ! currentVariation ) {
		return null;
	}

	const currentColorExists = colorVariations.some(
		( variation ) => variation.title === currentVariation
	);
	if ( currentColorExists ) {
		return null;
	}

	if ( ! currentPaletteColors?.length || ! currentTheme || ! customVariationTemplates?.length ) {
		return null;
	}

	// Extract palette type (last word before " - ") from titles like
	// "AI Website Builder Custom BoldText - 000000-000080-..."
	let paletteType: string | null = null;
	if ( currentVariation.includes( ' - ' ) ) {
		const parts = currentVariation.split( ' - ' );
		if ( parts.length >= 2 ) {
			const beforeDash = parts[ 0 ];
			const words = beforeDash.split( ' ' );
			if ( words.length > 0 ) {
				paletteType = words[ words.length - 1 ];
			}
		}
	}

	const currentThemeCopy: GlobalStyles = JSON.parse( JSON.stringify( currentTheme ) );
	const templateTheme: GlobalStyles = JSON.parse( JSON.stringify( customVariationTemplates[ 0 ] ) );
	const styles = currentThemeCopy.styles?.color ? currentThemeCopy.styles : templateTheme.styles;

	return {
		title: currentVariation,
		settings: {
			color: {
				palette: {
					theme: currentPaletteColors,
				},
			},
		},
		styles: styles || {},
		label: currentVariation,
		paletteType: paletteType || PaletteType.Bold,
	};
};

interface PrependCurrentColorVariationParams {
	colorVariations: ColorVariation[];
	currentColor: string | null;
	currentPaletteColors: PaletteColor[];
	currentTheme: GlobalStyles | null;
	customVariationTemplates: GlobalStyles[];
}

const prependCurrentColorVariation = ( {
	colorVariations,
	currentColor,
	currentPaletteColors,
	currentTheme,
	customVariationTemplates,
}: PrependCurrentColorVariationParams ): ColorVariation[] => {
	const currentColorVariation = createCurrentColorVariation( {
		colorVariations,
		currentColorMeta: currentColor,
		customVariationTemplates,
		currentPaletteColors,
		currentTheme,
	} );

	return currentColorVariation ? [ currentColorVariation, ...colorVariations ] : colorVariations;
};

interface Props {
	variations: ColorVariation[];
	customVariationTemplates?: GlobalStyles[];
	currentColor?: string | null;
	currentPaletteColors?: PaletteColor[];
	currentTheme?: GlobalStyles | null;
	onSelect?: ( variation: ColorVariation ) => void;
	globalStyles?: GlobalStyles;
	paletteColors?: PaletteColor[];
	themeColors?: PaletteColor[];
	currentColorVariation?: ColorVariation | null;
}

export default function ColorPicker( {
	variations,
	customVariationTemplates = [],
	currentColor = null,
	currentPaletteColors = [],
	currentTheme = null,
	onSelect = () => {},
	globalStyles = {} as GlobalStyles,
	paletteColors = [],
	themeColors = [],
	currentColorVariation,
}: Props ) {
	const [ colorVariations, setColorVariations ] = useState< ColorVariation[] >( [] );

	useEffect( () => {
		const prepared = prependCurrentColorVariation( {
			colorVariations: variations,
			currentColor,
			currentPaletteColors,
			currentTheme,
			customVariationTemplates,
		} );

		setColorVariations( prepared );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
	}, [] );

	if ( colorVariations.length === 0 ) {
		return null;
	}

	return (
		<VariationPicker
			variations={ colorVariations }
			maxToShow={ 4 }
			type="color"
			onSelect={ onSelect }
			activeVariationTitle={ currentColor }
			globalStyles={ globalStyles }
			paletteColors={ paletteColors }
			themeColors={ themeColors }
			currentColorVariation={ currentColorVariation }
		/>
	);
}
