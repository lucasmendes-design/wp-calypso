export type { Ability } from '@wordpress/abilities';

export interface AbilityResult {
	result: string;
	returnToAgent: boolean;
	agentMessage?: string;
}
