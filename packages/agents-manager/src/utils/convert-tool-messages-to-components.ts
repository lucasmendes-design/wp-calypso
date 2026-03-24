import { EscalationButton } from '../components/escalation-button';
import NextStepButton from '../components/next-step-button';
import SourcesDisplay from '../components/sources-display';
import UnavailableToolMessage from '../components/unavailable-tool-message';
import isAmAbilitiesEnabled from './is-am-abilities-enabled';
import { isEditorPage } from './is-editor-page';
import type { GetChatComponent } from './load-external-providers';
import type { UIMessage } from '@automattic/agenttic-client';

// Tool IDs that are silently dropped without a console warning.
const SILENT_TOOL_IDS = [ 'big_sky__set_processing_state' ];

/**
 * Scans message content blocks for JSON-encoded sources data and replaces
 * those blocks with a SourcesDisplay component. Text blocks that don't parse
 * as JSON (i.e. the actual answer text) are left untouched.
 */
function extractSourcesFromContent( messages: UIMessage[] ): UIMessage[] {
	return messages.map( ( message ) => {
		if ( message.role !== 'agent' ) {
			return message;
		}

		let hasSourcesBlock = false;
		const updatedContent = message.content.map( ( block ) => {
			if (
				block.type !== 'data' ||
				! Array.isArray( block.data?.sources ) ||
				block.data.sources.length === 0
			) {
				return block;
			}

			hasSourcesBlock = true;
			return {
				type: 'component' as const,
				component: SourcesDisplay as React.ComponentType,
				componentProps: { sources: block.data.sources },
			};
		} );

		if ( ! hasSourcesBlock ) {
			return message;
		}

		return { ...message, content: updatedContent };
	} );
}

interface ShowComponentData {
	type: string;
	props: Record< string, unknown >;
	followUpTasks?: boolean;
	isCurrent: boolean;
	postId?: number;
}

interface ShowComponentHandlerArgs {
	message: UIMessage;
	data: ShowComponentData;
	index: number;
	array: UIMessage[];
	getChatComponent?: GetChatComponent;
	currentPostId?: number;
}

/**
 * Big Sky handler: resolves components via `getChatComponent` from external providers.
 */
function handleShowComponentBs( {
	message,
	data,
	index,
	array,
	getChatComponent,
	currentPostId,
}: ShowComponentHandlerArgs ): UIMessage[] {
	if ( ! isEditorPage() ) {
		return [
			{
				...message,
				content: [
					{
						type: 'component' as const,
						component: UnavailableToolMessage as React.ComponentType,
						componentProps: { type: 'picker' },
					},
				],
			},
		];
	}

	const { type: contentType, props, followUpTasks, isCurrent, postId } = data;
	const Component = getChatComponent?.( contentType );

	if ( ! Component ) {
		return [];
	}

	const isLastMessage = index === array.length - 1;
	const isPageChanged = !! postId && !! currentPostId && postId !== currentPostId;
	const isStale = ! isLastMessage || ! isCurrent || isPageChanged;

	const componentMessage = {
		...message,
		content: [
			{
				type: 'component' as const,
				component: Component,
				componentProps: { ...( props as object ), contentType },
			},
		],
		disabled: isStale,
	};

	const BsNextStep = getChatComponent?.( 'next-step-button' );
	if ( isStale || ! followUpTasks || ! BsNextStep ) {
		return [ componentMessage ];
	}

	return [
		componentMessage,
		{
			...message,
			id: `${ message.id }-next-step`,
			content: [
				{
					type: 'component' as const,
					component: BsNextStep,
				},
			],
		},
	];
}

/**
 * AM handler: uses decoupled components from agents-manager directly.
 */
function handleShowComponentAm( {
	message,
	data,
	index,
	array,
	getChatComponent,
	currentPostId,
}: ShowComponentHandlerArgs ): UIMessage[] {
	if ( ! isEditorPage() ) {
		return [
			{
				...message,
				content: [
					{
						type: 'component' as const,
						component: UnavailableToolMessage as React.ComponentType,
						componentProps: { type: 'picker' },
					},
				],
			},
		];
	}

	const { type: contentType, props, followUpTasks, isCurrent, postId } = data;

	// TODO: resolve AM components directly by `contentType` as they are decoupled.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- runtime value from JSON
	const Component = getChatComponent?.( contentType as any );

	if ( ! Component ) {
		return [];
	}

	const isLastMessage = index === array.length - 1;
	const isPageChanged = !! postId && !! currentPostId && postId !== currentPostId;
	const isStale = ! isLastMessage || ! isCurrent || isPageChanged;

	const componentMessage = {
		...message,
		content: [
			{
				type: 'component' as const,
				component: Component,
				componentProps: { ...( props as object ), contentType },
			},
		],
		disabled: isStale,
	};

	if ( isStale || ! followUpTasks ) {
		return [ componentMessage ];
	}

	return [
		componentMessage,
		{
			...message,
			id: `${ message.id }-next-step`,
			content: [
				{
					type: 'component' as const,
					component: NextStepButton as React.ComponentType,
				},
			],
		},
	];
}

interface Options {
	messages: UIMessage[];
	getChatComponent?: GetChatComponent;
	currentPostId?: number;
}

/**
 * Converts tool-related messages to component messages.
 */
export default function convertToolMessagesToComponents( {
	messages,
	getChatComponent,
	currentPostId,
}: Options ): UIMessage[] {
	// First pass: extract sources data blocks into SourcesDisplay components.
	const messagesWithSources = extractSourcesFromContent( messages );

	return messagesWithSources.flatMap( ( message, index, array ) => {
		const firstContentText = message.content?.[ 0 ]?.text;

		// @ts-expect-error -- `assistant` comes from Big Sky messages
		if ( ( message.role !== 'agent' && message.role !== 'assistant' ) || ! firstContentText ) {
			return [ message ];
		}

		// The user asked for human support
		if (
			message.content.find(
				( content ) =>
					content.type === 'data' &&
					content.data?.flags &&
					typeof content.data.flags === 'object' &&
					'forward_to_human_support' in content.data.flags
			)
		) {
			return {
				...message,
				content: [
					{
						type: 'component',
						component: EscalationButton,
					},
				],
			};
		}

		// The tool message is a JSON string. Try to parse it, falling back to the original if invalid
		let textData;
		try {
			textData = JSON.parse( firstContentText );
		} catch ( _error ) {
			return [ message ];
		}

		// Handle `show-component` tool message
		if ( textData.tool_id === 'big_sky__show_component' ) {
			const handler = isAmAbilitiesEnabled() ? handleShowComponentAm : handleShowComponentBs;

			return handler( {
				message,
				data: ( textData.data ?? {} ) as ShowComponentData,
				index,
				array,
				getChatComponent,
				currentPostId,
			} );
		}

		// Handle `apply-block-edits` tool message
		if (
			textData.tool_id === 'big_sky__apply_block_edits' &&
			typeof textData.data?.summary === 'string'
		) {
			return [
				{
					...message,
					content: [
						{
							type: 'text' as const,
							text: textData.data.summary.trim(),
						},
					],
				},
			];
		}

		// Handle `wordpress-com-support` tool message
		if (
			textData.tool_id === 'big_sky__wordpress_com_support' &&
			typeof textData.data === 'string'
		) {
			return [
				{
					...message,
					content: [
						{
							type: 'text' as const,
							text: textData.data,
						},
					],
				},
			];
		}

		// Handle start over tool message
		if (
			textData.tool_id === 'big_sky__client_assistants' &&
			textData.data?.assistantId === 'big-sky-site-admin'
		) {
			return [
				{
					...message,
					content: [
						{
							type: 'component' as const,
							component: UnavailableToolMessage as React.ComponentType,
							componentProps: { type: 'start-over' },
						},
					],
				},
			];
		}

		// Remove unhandled tool messages to avoid displaying raw JSON to the user.
		if ( ! SILENT_TOOL_IDS.includes( textData.tool_id ) ) {
			// eslint-disable-next-line no-console
			console.warn( `[AgentsManager] Unhandled tool message with tool_id: ${ textData.tool_id }` );
		}
		return [];
	} );
}
