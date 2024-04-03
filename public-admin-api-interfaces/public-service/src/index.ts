import type { PublicStore } from "../../db-service/src/index.js";
import homePage from "./index.html";
import { handleUserRequest } from "./user.js";

const usernameRegExp = "[a-zA-Z0-9_-]{1,50}";

interface Env {
	STORE: Service<PublicStore>;
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const method = request.method.toUpperCase();

		const renderHomepage = async (error?: string) => {
			const tasks = await env.STORE.countAllTasks();

			return new HTMLRewriter()
				.on("#tasks", {
					element(element) {
						element.setInnerContent(tasks.toString());
					},
				})
				.on("#error", {
					element(element) {
						if (error) {
							element.setInnerContent(error);
						} else {
							element.remove();
						}
					},
				})
				.transform(
					new Response(homePage, { headers: { "Content-Type": "text/html" } }),
				);
		};

		if (method === "GET" && url.pathname === "/") {
			return await renderHomepage();
		}

		if (method === "POST" && url.pathname === "/") {
			const formData = await request.formData();
			const username = formData.get("username");

			// For brevity, we don't have any real authentication in this example application.
			// In a production app, you would want to first confirm the user's identity and then
			// set a session cookie before redirecting them to their page.
			if (
				typeof username !== "string" ||
				!username.match(new RegExp(`^${usernameRegExp}$`))
			) {
				return await renderHomepage(
					"Invalid username. Username should be between 1–50 characters, and be composed of only alphanumeric characters, dashes and underscores.",
				);
			}

			await env.STORE.upsertUser(username);

			return new Response(null, {
				status: 302,
				headers: { Location: `/user/${username}/` },
			});
		}

		const match = url.pathname.match(
			new RegExp(
				`^/user/(?<username>${usernameRegExp})(?<action>/(?:new|complete|uncomplete)?)$`,
			),
		);
		if (match) {
			const { action, username } = match.groups || {};
			// Again, in production you'd want to actually validate a session cookie here
			// to ensure the request is coming from the user who owns this page.
			if (!username || !action) {
				return new Response(null, { status: 404 });
			}

			return handleUserRequest({
				request,
				method,
				username,
				action,
				STORE: env.STORE,
			});
		}

		return new Response(null, { status: 404 });
	},
} as ExportedHandler<Env>;
