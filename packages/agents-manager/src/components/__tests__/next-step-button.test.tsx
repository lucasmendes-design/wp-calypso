/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NextStepButton from '../next-step-button';

jest.mock( '@wordpress/components', () => ( {
	Button: ( {
		children,
		onClick,
		...props
	}: {
		children: React.ReactNode;
		onClick: () => void;
		[ key: string ]: unknown;
	} ) => (
		<button onClick={ onClick } { ...props }>
			{ children }
		</button>
	),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

jest.mock( '@wordpress/data', () => ( {
	dispatch: () => ( {
		__unstableSetEditorMode: jest.fn(),
	} ),
} ) );

jest.mock( '../../utils/lock-unlock', () => ( {
	unlock: () => ( {
		resetZoomLevel: jest.fn(),
	} ),
} ) );

jest.mock( '../../utils/canvas-zoom', () => ( {
	zoomIn: jest.fn().mockResolvedValue( undefined ),
} ) );

describe( 'NextStepButton', () => {
	it( 'renders the button with correct text', () => {
		render( <NextStepButton onNextStep={ jest.fn() } /> );
		expect( screen.getByText( 'Move to next step' ) ).toBeInTheDocument();
	} );

	it( 'calls `onNextStep` after zoom in', async () => {
		const onNextStep = jest.fn();
		render( <NextStepButton onNextStep={ onNextStep } /> );
		await userEvent.click( screen.getByText( 'Move to next step' ) );
		await waitFor( () => {
			expect( onNextStep ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
