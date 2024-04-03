import dotenv from "dotenv";
import { join } from "path";
import { fileURLToPath } from "url";
import { ALL_COMMANDS } from "./commands.js";
import { InstallGlobalCommands } from "./utils.js";

dotenv.config({
	path: join(fileURLToPath(import.meta.url), "../../.dev.vars"),
});

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
