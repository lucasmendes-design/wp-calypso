/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColorPicker from '../color-picker';

// Mock VariationPicker
jest.mock( '../variation-picker', () => {
	const MockVariationPicker = ( { variations }: { variations: unknown[] } ) => (
		<div data-testid="mock-variation-picker" data-count={ variations.length } />
	);
	MockVariationPicker.displayName = 'MockVariationPicker';
	return MockVariationPicker;
} );

const defaultProps = {
	variations: [
		{ title: 'Bold', settings: {}, styles: {} },
		{ title: 'Pastel', settings: {}, styles: {} },
	],
};

describe( 'ColorPicker', () => {
	it( 'renders VariationPicker with variations', () => {
		render( <ColorPicker { ...defaultProps } /> );
		expect( screen.getByTestId( 'mock-variation-picker' ) ).toHaveAttribute( 'data-count', '2' );
	} );

	it( 'renders nothing when no variations are provided', () => {
		const { container } = render( <ColorPicker { ...defaultProps } variations={ [] } /> );
		expect( container.firstChild ).toBeNull();
	} );

	it( 'prepends current color variation when not in the list', () => {
		render(
			<ColorPicker
				{ ...defaultProps }
				currentColor="Custom Color"
				currentPaletteColors={ [ { color: '#ff0000', slug: 'primary', name: 'Primary' } ] }
				currentTheme={ { styles: { color: { text: '#000' } } } }
				customVariationTemplates={ [ { styles: { color: { text: '#000' } } } ] }
			/>
		);
		expect( screen.getByTestId( 'mock-variation-picker' ) ).toHaveAttribute( 'data-count', '3' );
	} );
} );
