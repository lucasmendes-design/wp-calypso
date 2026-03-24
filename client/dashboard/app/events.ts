export const DASHBOARD_EVENT = 'DASHBOARD_EVENT';

export const DASHBOARD_EVENT_TYPES = {
	SIDEBAR_OPEN: 'SIDEBAR_OPEN',
	SIDEBAR_CLOSE: 'SIDEBAR_CLOSE',
} as const;

export type DashboardEventDetail = {
	type: ( typeof DASHBOARD_EVENT_TYPES )[ keyof typeof DASHBOARD_EVENT_TYPES ];
};

export function dispatchDashboardEvent( detail: DashboardEventDetail ) {
	window.dispatchEvent( new CustomEvent( DASHBOARD_EVENT, { detail } ) );
}

export function subscribeDashboardEvent(
	handler: ( detail: DashboardEventDetail ) => void
): () => void {
	const listener = ( event: Event ) => {
		handler( ( event as CustomEvent< DashboardEventDetail > ).detail );
	};
	window.addEventListener( DASHBOARD_EVENT, listener );
	return () => window.removeEventListener( DASHBOARD_EVENT, listener );
}
