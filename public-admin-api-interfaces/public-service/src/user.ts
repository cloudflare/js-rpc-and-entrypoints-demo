import { RpcStub } from "cloudflare:workers";
import type { AuthedStore, PublicStore } from "../../db-service/src";
import userPage from "./user.html";
import { escape } from "./utils/escape.js";
import { html } from "./utils/html";

export const handleUserRequest = async ({
	request,
	method,
	username,
	action,
	STORE,
}: {
	request: Request;
	method: string;
	username: string;
	action: string;
	STORE: Service<PublicStore>;
}) => {
	let store: RpcStub<AuthedStore>;
	try {
		store = await STORE.getStoreForUserByUsername(username);
	} catch (thrown) {
		if (thrown instanceof Error && thrown.message === "User not found") {
			return new Response(null, { status: 404 });
		} else {
			return new Response(null, { status: 500 });
		}
	}

	const renderUserPage = async (error?: string) => {
		const tasks = await store.getTasks();

		const renderTask = (task: (typeof tasks)[number]) => {
			return html`<li>
				<form
					method="POST"
					action="${task.completed ? "./uncomplete" : "./complete"}"
				>
					<input
						type="checkbox"
						onchange="((checkbox) => checkbox.form.submit())(this);"
						${task.completed ? "checked" : ""}
					/><input
						type="hidden"
						name="id"
						value="${escape(task.id.toString())}"
					/>
					${escape(task.title)}
				</form>
			</li>`;
		};

		return new HTMLRewriter()
			.on("#username", {
				element(element) {
					element.setInnerContent(username);
				},
			})
			.on("#tasks", {
				element(element) {
					element.prepend(tasks.map((task) => renderTask(task)).join("\n"), {
						html: true,
					});
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
				new Response(userPage, {
					headers: { "Content-Type": "text/html" },
				}),
			);
	};

	if (method === "GET" && action === "/") {
		return await renderUserPage();
	}

	if (method === "POST" && action === "/new") {
		const formData = await request.formData();
		const title = formData.get("title");

		if (typeof title !== "string" || !title.match(new RegExp(/^.{1,140}$/))) {
			return await renderUserPage(
				"Invalid task title. Title should be between 1–140 characters.",
			);
		}

		await store.createTask(title);

		return new Response(null, {
			status: 302,
			headers: { Location: `/user/${username}/` },
		});
	}

	if (
		method === "POST" &&
		(action === "/complete" || action === "/uncomplete")
	) {
		const formData = await request.formData();
		const idString = formData.get("id");

		if (typeof idString !== "string") {
			return await renderUserPage(
				"Invalid task toggle request. Must send a numeric 'id' string value.",
			);
		}

		const id = parseInt(idString);

		if (isNaN(id)) {
			return await renderUserPage(
				"Invalid task toggle request. Must send a numeric 'id' string value.",
			);
		}

		switch (action) {
			case "/complete":
				await store.completeTask(id);
				break;
			case "/uncomplete":
				await store.uncompleteTask(id);
				break;
		}

		return new Response(null, {
			status: 302,
			headers: { Location: `/user/${username}/` },
		});
	}

	return new Response(null, { status: 404 });
};
