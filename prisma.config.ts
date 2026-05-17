import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  datasource: {
    url,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
