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
		render( <NextStepButton onClick={ jest.fn() } /> );
		expect( screen.getByText( 'Move to next step' ) ).toBeInTheDocument();
	} );

	it( 'calls `onClick` after zoom in', async () => {
		const onClick = jest.fn();
		render( <NextStepButton onClick={ onClick } /> );
		await userEvent.click( screen.getByText( 'Move to next step' ) );
		await waitFor( () => {
			expect( onClick ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
