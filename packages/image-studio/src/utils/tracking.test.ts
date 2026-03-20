import { recordTracksEvent } from '@automattic/calypso-analytics';
import {
	detectPlatform,
	resetPlatformCache,
	trackImageStudioOpened,
	trackImageStudioClosed,
} from './tracking';

// Mock @automattic/calypso-analytics
jest.mock( '@automattic/calypso-analytics', () => ( {
	recordTracksEvent: jest.fn(),
} ) );

// Mock @wordpress/data
jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

const mockedRecordTracksEvent = recordTracksEvent as jest.MockedFunction<
	typeof recordTracksEvent
>;

describe( 'detectPlatform', () => {
	beforeEach( () => {
		resetPlatformCache();
		delete ( window as any ).imageStudioData;
	} );

	it( 'returns "wpcom" when imageStudioData is not present', () => {
		expect( detectPlatform() ).toBe( 'wpcom' );
	} );

	it( 'returns "jetpack" when imageStudioData is present', () => {
		( window as any ).imageStudioData = { enabled: true };
		expect( detectPlatform() ).toBe( 'jetpack' );
	} );

	it( 'caches the result across calls', () => {
		( window as any ).imageStudioData = { enabled: true };
		expect( detectPlatform() ).toBe( 'jetpack' );

		// Remove the signal — should still return cached value
		delete ( window as any ).imageStudioData;
		expect( detectPlatform() ).toBe( 'jetpack' );
	} );

	it( 'returns fresh value after cache reset', () => {
		( window as any ).imageStudioData = { enabled: true };
		expect( detectPlatform() ).toBe( 'jetpack' );

		resetPlatformCache();
		delete ( window as any ).imageStudioData;

		expect( detectPlatform() ).toBe( 'wpcom' );
	} );
} );

describe( 'tracks event prefix', () => {
	beforeEach( () => {
		resetPlatformCache();
		mockedRecordTracksEvent.mockClear();
		delete ( window as any ).imageStudioData;
	} );

	it( 'uses wpcom_ prefix when imageStudioData is absent', () => {
		trackImageStudioOpened( { mode: 'generate' as any } );
		expect( mockedRecordTracksEvent ).toHaveBeenCalledWith(
			'wpcom_image_studio_opened',
			expect.any( Object )
		);
	} );

	it( 'uses jetpack_ prefix when imageStudioData is present', () => {
		( window as any ).imageStudioData = { enabled: true };
		trackImageStudioOpened( { mode: 'edit' as any } );
		expect( mockedRecordTracksEvent ).toHaveBeenCalledWith(
			'jetpack_image_studio_opened',
			expect.any( Object )
		);
	} );

	it( 'uses wpcom_ prefix for closed event when imageStudioData is absent', () => {
		trackImageStudioClosed( { mode: 'edit' as any } );
		expect( mockedRecordTracksEvent ).toHaveBeenCalledWith(
			'wpcom_image_studio_closed',
			expect.any( Object )
		);
	} );

	it( 'uses jetpack_ prefix for closed event when imageStudioData is present', () => {
		( window as any ).imageStudioData = { enabled: true };
		trackImageStudioClosed( { mode: 'generate' as any } );
		expect( mockedRecordTracksEvent ).toHaveBeenCalledWith(
			'jetpack_image_studio_closed',
			expect.any( Object )
		);
	} );
} );
