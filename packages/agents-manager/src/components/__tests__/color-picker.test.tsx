/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
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
	customVariationTemplates: [],
	currentColor: null,
	currentPaletteColors: [],
	currentTheme: null,
	onSetCurrentColor: jest.fn(),
	onVariationsReady: jest.fn(),
	onSelect: jest.fn(),
	globalStyles: {},
	paletteColors: [],
	themeColors: [],
};

describe( 'ColorPicker', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders VariationPicker with variations', () => {
		const { getByTestId } = render( <ColorPicker { ...defaultProps } /> );
		const picker = getByTestId( 'mock-variation-picker' );
		expect( picker ).toBeInTheDocument();
		expect( picker ).toHaveAttribute( 'data-count', '2' );
	} );

	it( 'calls onVariationsReady on mount', () => {
		render( <ColorPicker { ...defaultProps } /> );
		expect( defaultProps.onVariationsReady ).toHaveBeenCalledWith(
			expect.arrayContaining( [
				expect.objectContaining( { title: 'Bold' } ),
				expect.objectContaining( { title: 'Pastel' } ),
			] )
		);
	} );

	it( 'renders nothing when no variations are provided', () => {
		const { container } = render( <ColorPicker { ...defaultProps } variations={ [] } /> );
		expect( container.firstChild ).toBeNull();
	} );

	it( 'prepends current color variation when not in the list', () => {
		const onVariationsReady = jest.fn();
		render(
			<ColorPicker
				{ ...defaultProps }
				currentColor="Custom Color"
				currentPaletteColors={ [ { color: '#ff0000', slug: 'primary', name: 'Primary' } ] }
				currentTheme={ { styles: { color: { text: '#000' } } } }
				customVariationTemplates={ [ { styles: { color: { text: '#000' } } } ] }
				onVariationsReady={ onVariationsReady }
			/>
		);
		expect( onVariationsReady ).toHaveBeenCalledWith(
			expect.arrayContaining( [ expect.objectContaining( { title: 'Custom Color' } ) ] )
		);
	} );
} );
