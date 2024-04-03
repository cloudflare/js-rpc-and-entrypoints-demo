import { WorkerEntrypoint } from "cloudflare:workers";
import {
	Interaction,
	InteractionResponse,
	InteractionResponseType,
} from "discord-interactions";
import type { ROLLADICE_COMMAND } from "../scripts/commands.js";
import { getRandomEmoji } from "./utils.js";

export class DiscordBot extends WorkerEntrypoint {
	async hello(): Promise<InteractionResponse> {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: "hello world " + getRandomEmoji(),
			},
		};
	}

	async rolladice(
		body: Interaction<typeof ROLLADICE_COMMAND>,
	): Promise<InteractionResponse> {
		return {
			type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
			data: {
				content: `You rolled a ${Math.ceil((body.data?.options?.[0]?.value as number) * Math.random())}`,
			},
		};
	}
}
