export * from "discord-interactions";

// We're cheekily patching this module with some additional
// types to paint a better picture of what a first-class Workers
// integration could look like.
declare module "discord-interactions" {
	export interface InteractionResponse {
		type: number;
		data: {
			tts?: boolean;
			content?: string;
			// others...
		};
	}
	export interface InteractionData<
		Options extends { type: number; required?: boolean }[] = [],
	> {
		id: string;
		name: string;
		type: number;
		options?: Options[0]["type"] extends 4
			? Options[0]["required"] extends true
				? {
						name: string;
						type: number;
						value: number;
					}
				: { name: string; type: number; value?: number }
			: { name: string; type: number; value?: string | number | boolean }[];
		// others...
	}

	export interface Interaction<
		Command extends { options: { type: number; required?: boolean }[] } = {
			options: [];
		},
	> {
		id: string;
		application_id: string;
		type: InteractionType;
		data?: InteractionData<Command["options"]>;
		token: string;
		version: number;
		// others...
	}
}
