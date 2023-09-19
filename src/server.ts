import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { Hono } from "hono";
const app = new Hono();

app.get("/", (c) => c.text("Hono!"));
app.get("/wallets", async (c) => {
  const wallets = await prisma.wallets.findMany({});
  return c.json(wallets);
});

export default app;
