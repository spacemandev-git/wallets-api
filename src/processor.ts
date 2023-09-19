import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CARPOOL_QUERY_URL = "https://mainnet.carpool.dev/query/solana";
const currentDate = new Date();
const thirtyDaysAgo = new Date(
  new Date().setDate(currentDate.getDate() - 30)
).toISOString();

(async () => {
  while (true) {
    console.log("Starting to update active wallets...");
    await updateActiveWallets();
    console.log("Active Wallets updated @ ", new Date());
    console.log("Sleeping for 24 hours");
    await new Promise((res, rej) => {
      setTimeout(res, 1000 * 60 * 60 * 24); // update the leaderboard every 30 minutes
    });
  }
})();

async function updateActiveWallets() {
  // start each processor, then wait 24hrs, then do it again
  //Clear the database
  await prisma.wallets.deleteMany();

  // Get Top Wallets in BGUM
  try {
    await prisma.wallets.createMany({
      data: (
        await getBGUMAddresses()
      ).map((v) => {
        return {
          wallet: v.value,
          tokens: {},
        };
      }),
    });
  } catch (e) {
    console.error(e);
  }
}

async function getBGUMAddresses() {
  const bgumTopAddresses = (await (
    await fetch(CARPOOL_QUERY_URL, {
      headers: {
        "x-api-key": process.env.CARPOOL_KEY!,
        "Content-Type": "application/json",
      },
      method: "post",
      body: JSON.stringify({
        type: "MOST_COMMON_ACCOUNTS_INSTRUCTION",
        query: {
          programId: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
          accountName: "leafOwner",
          sort: {
            order: "desc",
          },
          timeRange: {
            after: thirtyDaysAgo,
          },
          limit: 1000,
        },
      }),
    })
  ).json()) as any;

  if (bgumTopAddresses.error) {
    throw new Error(bgumTopAddresses.error);
  }
  return bgumTopAddresses.response.values;
}
