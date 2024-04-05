import type { AdminStore } from "../../db-service/src/index.js";
import homePage from "./index.html";

interface Env {
	STORE: Service<AdminStore>;
}

export default {
	async fetch(request, env) {
		// In a production app, you'd want to protect this with Cloudflare Access
		// and validate any incoming requests by checking their `CF_Authorization` header
		// https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

		const method = request.method.toUpperCase();
		const { pathname } = new URL(request.url);

		const renderHomePage = async (error?: string) => {
			const users =
				(await env.STORE.countAllUsers()) ?? "Could not count users";
			const tasks =
				(await env.STORE.countAllTasks()) ?? "Could not count tasks";
			const completedTasks =
				(await env.STORE.countAllCompletedTasks()) ??
				"Could not count completed tasks";

			return new HTMLRewriter()
				.on("#users", {
					async element(element) {
						element.setInnerContent(users.toString());
					},
				})
				.on("#tasks", {
					async element(element) {
						element.setInnerContent(tasks.toString());
					},
				})
				.on("#completed-tasks", {
					async element(element) {
						element.setInnerContent(completedTasks.toString());
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

		if (method === "GET" && pathname === "/") {
			return renderHomePage();
		}

		if (method === "POST" && pathname === "/") {
			const formData = await request.formData();
			const action = formData.get("action");

			if (typeof action !== "string") {
				return renderHomePage("Invalid action.");
			}

			switch (action) {
				case "delete-users":
					await env.STORE.deleteAllUsers();
					break;
				case "delete-tasks":
					await env.STORE.deleteAllTasks();
					break;
				case "delete-completed-tasks":
					await env.STORE.deleteAllCompletedTasks();
					break;
				default:
					return renderHomePage("Invalid action.");
			}

			return renderHomePage();
		}

		return new Response(null, { status: 404 });
	},
} as ExportedHandler<Env>;
