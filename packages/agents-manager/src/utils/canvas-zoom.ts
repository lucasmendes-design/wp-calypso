/**
 * Get the editor canvas iframe and its inner elements.
 */
function getCanvasIframeElements() {
	const canvasIframe = document.querySelector< HTMLIFrameElement >( '[name="editor-canvas"]' );
	const canvasIframeDocument = canvasIframe?.contentDocument ?? null;
	const canvasIframeRoot = canvasIframeDocument?.documentElement ?? null;
	const canvasIframeBody = canvasIframeDocument?.body ?? null;
	return { canvasIframe, canvasIframeRoot, canvasIframeDocument, canvasIframeBody };
}

/**
 * Block double-click events to prevent editing during zoom-out mode.
 */
const blockDblclick = ( e: Event ) => {
	e.preventDefault();
	e.stopImmediatePropagation();
};

/**
 * Wait for a given number of milliseconds.
 */
function setDelay( ms: number ): Promise< void > {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

interface ZoomOutDispatchers {
	/** Set the editor canvas zoom level. */
	setZoomLevel: ( level: number ) => void;
	/** Set the editor mode. */
	__unstableSetEditorMode: ( mode: string ) => void;
}

interface ZoomInDispatchers {
	/** Reset the editor canvas zoom level to default. */
	resetZoomLevel: () => void;
	/** Set the editor mode. */
	__unstableSetEditorMode: ( mode: string ) => void;
}

interface ZoomOutOptions {
	/** Whether to block double-click events on the canvas during zoom-out. */
	blockDoubleClick?: boolean;
}

/**
 * Zoom out the editor canvas and wait for the animation to complete.
 * @param dispatchers - Block editor dispatch functions.
 * @param options     - Optional zoom-out behaviour.
 */
export async function zoomOut(
	dispatchers: ZoomOutDispatchers,
	options: ZoomOutOptions = {}
): Promise< void > {
	const { canvasIframeRoot, canvasIframeBody } = getCanvasIframeElements();

	dispatchers.setZoomLevel( 0.5 );
	dispatchers.__unstableSetEditorMode( 'zoom-out' );

	if ( options.blockDoubleClick && canvasIframeBody ) {
		canvasIframeBody.addEventListener( 'dblclick', blockDblclick, true );
	}

	// Wait for the next microtask to ensure animations are registered.
	await Promise.resolve();

	if ( canvasIframeRoot ) {
		await Promise.all( canvasIframeRoot.getAnimations().map( ( a ) => a.finished ) );
	}

	window.dispatchEvent( new Event( 'resize' ) );
	// Wait for the next event loop so the `.zoom-out-animation` class is removed.
	await setDelay( 0 );
}

/**
 * Zoom in the editor canvas and wait for the animation to complete.
 * @param dispatchers - Block editor dispatch functions.
 */
export async function zoomIn( dispatchers: ZoomInDispatchers ): Promise< void > {
	const { canvasIframeRoot } = getCanvasIframeElements();

	dispatchers.resetZoomLevel();
	dispatchers.__unstableSetEditorMode( 'edit' );

	await Promise.resolve();

	if ( canvasIframeRoot ) {
		await Promise.all( canvasIframeRoot.getAnimations().map( ( a ) => a.finished ) );
	}

	window.dispatchEvent( new Event( 'resize' ) );

	// Remove double-click blocker.
	const { canvasIframeBody } = getCanvasIframeElements();
	if ( canvasIframeBody ) {
		canvasIframeBody.removeEventListener( 'dblclick', blockDblclick, true );
	}

	await setDelay( 0 );
}
