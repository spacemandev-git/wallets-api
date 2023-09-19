import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { Hono } from "hono";
const app = new Hono();

app.get("/", (c) => c.text("Hono!"));
app.get("/wallets", async (c) => {
  try {
    const wallets = await prisma.wallets.findMany({});
    return c.json(wallets);
  } catch (e: any) {
    console.error(e);
    return c.json({ error: e.message || e });
  }
});

console.log("Hono is running!");
export default app;
