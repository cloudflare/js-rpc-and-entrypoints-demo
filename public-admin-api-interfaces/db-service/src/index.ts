import { RpcTarget, WorkerEntrypoint } from "cloudflare:workers";

interface Env {
	D1: D1Database;
	STORE: Service<AdminStore>;
}

export class AuthedStore extends RpcTarget {
	#userId: number;
	#D1: D1Database;

	constructor(userId: number, d1: D1Database) {
		super();
		this.#userId = userId;
		this.#D1 = d1;
	}

	async getTasks() {
		return (
			await this.#D1
				.prepare(
					"SELECT id, title, completed FROM tasks WHERE user_id = ? ORDER BY created_at ASC;",
				)
				.bind(this.#userId)
				.all<{ id: number; title: string; completed: number }>()
		).results.map((task) => ({
			id: task.id,
			title: task.title,
			completed: task.completed === 1,
		}));
	}

	async createTask(title: string) {
		await this.#D1
			.prepare("INSERT INTO tasks (title, user_id) VALUES (?, ?);")
			.bind(title, this.#userId)
			.run();
	}

	async completeTask(id: number) {
		await this.#D1
			.prepare("UPDATE tasks SET completed = 1 WHERE id = ?;")
			.bind(id)
			.run();
	}

	async uncompleteTask(id: number) {
		await this.#D1
			.prepare("UPDATE tasks SET completed = 0 WHERE id = ?;")
			.bind(id)
			.run();
	}
}

export class PublicStore extends WorkerEntrypoint<Env> {
	async countAllTasks() {
		const tasks = await this.env.D1.prepare(
			"SELECT COUNT(0) AS count FROM tasks;",
		).first<number>("count");

		if (tasks === null) {
			throw new Error("Failed to count tasks");
		}

		return tasks;
	}

	async upsertUser(username: string) {
		await this.env.D1.prepare(
			"INSERT OR IGNORE INTO users (username) VALUES (?);",
		)
			.bind(username)
			.run();
	}

	async getStoreForUserByUsername(username: string) {
		const id = await this.env.D1.prepare(
			"SELECT id FROM users WHERE username = ?;",
		)
			.bind(username)
			.first<number>("id");
		if (id) {
			return new AuthedStore(id, this.env.D1);
		}

		throw new Error("User not found");
	}
}

export class AdminStore extends WorkerEntrypoint<Env> {
	async healthcheck() {
		const result =
			await this.env.D1.prepare("SELECT 1 AS alive;").first<number>("alive");
		return result === 1;
	}

	async countAllUsers() {
		return await this.env.D1.prepare(
			"SELECT COUNT(0) AS count FROM users;",
		).first<number>("count");
	}

	async countAllTasks() {
		return await this.env.D1.prepare(
			"SELECT COUNT(0) AS count FROM tasks;",
		).first<number>("count");
	}

	async countAllCompletedTasks() {
		return await this.env.D1.prepare(
			"SELECT COUNT(0) AS count FROM tasks WHERE completed = 1;",
		).first<number>("count");
	}

	async deleteAllUsers() {
		return await this.env.D1.exec("DELETE FROM users;");
	}

	async deleteAllTasks() {
		return await this.env.D1.exec("DELETE FROM tasks;");
	}

	async deleteAllCompletedTasks() {
		return await this.env.D1.exec("DELETE FROM tasks WHERE completed = 1;");
	}
}

export default class extends WorkerEntrypoint<Env> {
	async fetch() {
		const ok = await this.env.STORE.healthcheck();
		return new Response(ok ? "OK" : "NOT OK", { status: ok ? 200 : 500 });
	}
	// to routinely clean up our public demo
	// feel free to remove this if you're deploying this yourself!
	async scheduled() {
		this.ctx.waitUntil(this.env.STORE.deleteAllUsers());
	}
}
