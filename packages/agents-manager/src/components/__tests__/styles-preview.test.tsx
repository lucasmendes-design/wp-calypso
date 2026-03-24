/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StylesPreview from '../styles-preview';

jest.mock( '@wordpress/block-editor', () => ( {
	__unstableEditorStyles: ( { styles }: { styles: unknown[] } ) => (
		<div data-testid="mock-editor-styles" data-styles={ JSON.stringify( styles ) } />
	),
	__unstableIframe: ( {
		children,
		...props
	}: {
		children: React.ReactNode;
		[ key: string ]: unknown;
	} ) => (
		<div data-testid="mock-editor-iframe" { ...props }>
			{ children }
		</div>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	__experimentalHStack: ( {
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	} ) => <div className={ className }>{ children }</div>,
	__unstableMotion: {
		div: ( { children, ...props }: { children?: React.ReactNode; [ key: string ]: unknown } ) => (
			<div { ...props }>{ children }</div>
		),
	},
	__experimentalVStack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/compose', () => ( {
	useResizeObserver: () => [ null, { width: 500 } ],
	useThrottle: ( fn: ( ...args: unknown[] ) => void ) => fn,
} ) );

const defaultProps = {
	globalStyles: {
		settings: {
			typography: {
				fontFamilies: {
					theme: [ { name: 'Arial', fontFamily: 'Arial, sans-serif' } ],
				},
			},
			color: {
				palette: {
					theme: [
						{ slug: 'primary', color: '#000000' },
						{ slug: 'secondary', color: '#ffffff' },
					],
				},
			},
		},
		styles: {
			typography: {
				fontFamily: 'Arial',
				fontWeight: '400',
				fontStyle: 'normal',
				textTransform: 'none',
			},
			color: {
				text: '#000000',
				background: '#ffffff',
			},
		},
	},
	paletteColors: [
		{ slug: 'primary', color: '#000000' },
		{ slug: 'secondary', color: '#ffffff' },
	],
	themeColors: [
		{ slug: 'primary', color: '#000000' },
		{ slug: 'secondary', color: '#ffffff' },
	],
};

describe( 'StylesPreview', () => {
	it( 'renders without crashing', () => {
		render( <StylesPreview { ...defaultProps } label="Test Label" type="font" /> );
		expect( screen.getByTestId( 'mock-editor-iframe' ) ).toBeInTheDocument();
	} );

	it( 'displays the correct label', () => {
		render( <StylesPreview { ...defaultProps } label="Test Label" type="font" /> );
		expect( screen.getByText( 'Test Label' ) ).toBeInTheDocument();
	} );

	it( 'renders font preview when type is "font"', () => {
		render( <StylesPreview { ...defaultProps } label="Font Preview" type="font" /> );
		expect( screen.getByText( 'A' ) ).toBeInTheDocument();
		const lowercase = screen.getByText( 'a' );
		expect( lowercase ).toBeInTheDocument();
		expect( lowercase ).toHaveStyle( { textTransform: 'none' } );
	} );

	it( 'renders color swatches when type is "color"', () => {
		const { container } = render(
			<StylesPreview { ...defaultProps } label="Color Preview" type="color" />
		);
		expect( container.querySelector( '.color-swatch' ) ).toBeInTheDocument();
	} );

	it( 'renders button preview when type is "button"', () => {
		const { container } = render(
			<StylesPreview { ...defaultProps } label="Button Preview" type="button" />
		);
		expect( container.querySelector( 'button' ) ).toBeInTheDocument();
	} );
} );
