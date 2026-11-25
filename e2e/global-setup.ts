import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

export default function globalSetup() {
  dotenv.config();
  execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
}
