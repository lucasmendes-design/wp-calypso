import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import StylesPreview from '../styles-preview';
import type { ColorVariation, GlobalStyles, PaletteColor } from '../styles-preview';
import './style.scss';

interface Props {
	variation: ColorVariation;
	type: 'color' | 'font' | 'button';
	isActive?: boolean;
	onSelect?: ( variation: ColorVariation ) => void;
	globalStyles: GlobalStyles;
	paletteColors: PaletteColor[];
	themeColors: PaletteColor[];
	currentColorVariation?: ColorVariation | null;
	fontFamiliesToCSS?: ( fontFamilies: Array< { name: string; fontFamily: string } > ) => string;
}

export default function Variation( {
	variation,
	type,
	isActive = false,
	onSelect,
	globalStyles,
	paletteColors,
	themeColors,
	currentColorVariation,
	fontFamiliesToCSS,
}: Props ) {
	const handleSelectVariation = () => {
		onSelect?.( variation );
	};

	const selectOnEnter = ( event: React.KeyboardEvent ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			handleSelectVariation();
		}
	};

	let label = variation?.title;
	if ( variation?.description ) {
		label = sprintf(
			/* translators: %1$s: variation title. %2$s variation description. */
			__( '%1$s (%2$s)', '__i18n_text_domain__' ),
			variation?.title,
			variation?.description
		);
	}

	return (
		<div
			className={ clsx( 'agents-manager-variation-picker__variation', {
				'is-active': isActive,
			} ) }
			role="button"
			onClick={ handleSelectVariation }
			onKeyDown={ selectOnEnter }
			tabIndex={ 0 }
			aria-label={ label }
			aria-current={ isActive }
		>
			{ /* eslint-disable-next-line wpcalypso/jsx-classname-namespace -- WordPress/Gutenberg class */ }
			<div className="edit-site-global-styles-variations_item-preview">
				<StylesPreview
					label={ variation?.title }
					type={ type }
					variation={ variation }
					globalStyles={ globalStyles }
					paletteColors={ paletteColors }
					themeColors={ themeColors }
					currentColorVariation={ currentColorVariation }
					fontFamiliesToCSS={ fontFamiliesToCSS }
				/>
			</div>
		</div>
	);
}
