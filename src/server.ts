import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import express from "express";
import cors from "cors";
import http from "http";

const server = express();
server.use(cors());
server.use(express.json());

const httpServer = http.createServer(server);
httpServer.listen(process.env.PORT, () => {
  console.log(`HTTP Server running on port ${process.env.PORT}`);
});

server.get("/", (req, res) => res.json({ success: "Express" }));
server.get("/wallets", async (req, res) => {
  try {
    const wallets = await prisma.wallets.findMany({});
    return res.json(wallets);
  } catch (e: any) {
    console.error(e);
    return res.json({ error: e.message || e });
  }
});
