import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { zoomIn } from '../../utils/canvas-zoom';
import { unlock } from '../../utils/lock-unlock';
import './style.scss';

interface Props {
	onNextStep: () => void;
}

export default function NextStepButton( { onNextStep }: Props ) {
	const handleClick = async () => {
		const { resetZoomLevel } = unlock( dispatch( blockEditorStore ) );
		const { __unstableSetEditorMode } = dispatch( blockEditorStore );

		await zoomIn( { resetZoomLevel, __unstableSetEditorMode } );
		onNextStep();
	};

	return (
		<Button className="agents-manager__next-step-button" variant="primary" onClick={ handleClick }>
			{ __( 'Move to next step', '__i18n_text_domain__' ) }
		</Button>
	);
}
