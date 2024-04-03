import { WorkerEntrypoint } from "cloudflare:workers";
import {
	Interaction,
	InteractionResponse,
	InteractionResponseType,
	InteractionType,
	verifyKey,
} from "discord-interactions";
import { DiscordBot } from "../src/index.js";

interface Env {
	DISCORD_TOKEN: string;
	APP_ID: string;
	PUBLIC_KEY: string;

	DISCORD_BOT: Service<DiscordBot>;
}

export default class extends WorkerEntrypoint<Env> {
	async fetch(request: Request) {
		const signature = request.headers.get("X-Signature-Ed25519") || "";
		const timestamp = request.headers.get("X-Signature-Timestamp") || "";

		const isValidRequest = verifyKey(
			await request.clone().arrayBuffer(),
			signature,
			timestamp,
			this.env.PUBLIC_KEY,
		);
		if (!isValidRequest) {
			return new Response("Bad request signature", { status: 401 });
		}

		const body = await request.json<Interaction>();

		if (body.type === InteractionType.PING) {
			return new Response(
				JSON.stringify({ type: InteractionResponseType.PONG }),
			);
		}

		if (body.type === InteractionType.APPLICATION_COMMAND) {
			const { name } = body.data as {
				name: string;
				id: string;
				type: number;
			};

			const result = await (
				this.env.DISCORD_BOT[name as keyof typeof this.env.DISCORD_BOT] as (
					body: Interaction,
				) => Promise<InteractionResponse>
			)(body);
			console.log(JSON.stringify(result));

			return new Response(JSON.stringify(result));
		}

		return new Response(null, { status: 404 });
	}
}

export { DiscordBot };
