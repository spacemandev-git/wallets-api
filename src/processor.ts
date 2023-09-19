import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient, Wallets } from "@prisma/client";
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
    let wallets: Wallets[] = (await getBGUMAddresses()).map((v) => {
      return {
        wallet: v.value,
        bgumMint: 0,
        bgumTransfer: 0,
        bgumBurn: 0,
        tensorIX: 0,
        meIX: 0,
        sharkyIX: 0,
        foxyIX: 0,
        cmMints: 0,
        sol: 0,
      };
    });
    wallets = await processBGUMMintBatch(wallets);
    wallets = await processBGUMTransferBatch(wallets);
    wallets = await processBGUMBurnBatch(wallets);

    await prisma.wallets.createMany({
      data: wallets,
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

async function processBGUMMintBatch(wallets: Wallets[]) {
  let newWalletArray: Wallets[] = [];
  for (let i = 0; i <= 1000; i += 10) {
    newWalletArray.push(
      ...(await Promise.all(
        wallets.slice(i, i + 10).map(async (wallet) => {
          const response = (await (
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
                  filter: {
                    or: [
                      {
                        type: "INSTRUCTION_NAME",
                        instructionName: "mintToCollectionV1",
                      },
                      {
                        type: "INSTRUCTION_NAME",
                        instructionName: "mintV1",
                      },
                    ],
                    and: {
                      type: "INSTRUCTION_ACCOUNT",
                      accountPubKey: wallet.wallet,
                      accountName: "leafOwner",
                    },
                  },
                  sort: {
                    order: "desc",
                  },
                  timeRange: {
                    after: thirtyDaysAgo,
                  },
                  limit: 1,
                },
              }),
            })
          ).json()) as any;
          if (response.error) {
            throw new Error(response.error);
          } else {
            wallet.bgumMint = response.response.values[0]?.count || 0;
          }
          return wallet;
        })
      ))
    );
  }
  return newWalletArray;
}

async function processBGUMTransferBatch(wallets: Wallets[]) {
  let newWalletArray: Wallets[] = [];
  for (let i = 0; i <= 1000; i += 10) {
    newWalletArray.push(
      ...(await Promise.all(
        wallets.slice(i, i + 10).map(async (wallet) => {
          const response = (await (
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
                  filter: {
                    or: [
                      {
                        type: "INSTRUCTION_NAME",
                        instructionName: "transfer",
                      },
                    ],
                    and: {
                      type: "INSTRUCTION_ACCOUNT",
                      accountPubKey: wallet.wallet,
                      accountName: "leafOwner",
                    },
                  },
                  sort: {
                    order: "desc",
                  },
                  timeRange: {
                    after: thirtyDaysAgo,
                  },
                  limit: 1,
                },
              }),
            })
          ).json()) as any;
          if (response.error) {
            throw new Error(response.error);
          } else {
            wallet.bgumTransfer = response.response.values[0]?.count || 0;
          }
          return wallet;
        })
      ))
    );
  }
  return newWalletArray;
}

async function processBGUMBurnBatch(wallets: Wallets[]) {
  let newWalletArray: Wallets[] = [];
  for (let i = 0; i <= 1000; i += 10) {
    newWalletArray.push(
      ...(await Promise.all(
        wallets.slice(i, i + 10).map(async (wallet) => {
          const response = (await (
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
                  filter: {
                    or: [
                      {
                        type: "INSTRUCTION_NAME",
                        instructionName: "burn",
                      },
                    ],
                    and: {
                      type: "INSTRUCTION_ACCOUNT",
                      accountPubKey: wallet.wallet,
                      accountName: "leafOwner",
                    },
                  },
                  sort: {
                    order: "desc",
                  },
                  timeRange: {
                    after: thirtyDaysAgo,
                  },
                  limit: 1,
                },
              }),
            })
          ).json()) as any;
          if (response.error) {
            throw new Error(response.error);
          } else {
            wallet.bgumBurn = response.response.values[0]?.count || 0;
          }
          return wallet;
        })
      ))
    );
  }
  return newWalletArray;
}

async function processTensorIXBatch(wallets: Wallets[]) {
  let newWalletArray: Wallets[] = [];
  for (let i = 0; i <= 1000; i += 10) {
    newWalletArray.push(
      ...(await Promise.all(
        wallets.slice(i, i + 10).map(async (wallet) => {
          const response = (await (
            await fetch(CARPOOL_QUERY_URL, {
              headers: {
                "x-api-key": process.env.CARPOOL_KEY!,
                "Content-Type": "application/json",
              },
              method: "post",
              body: JSON.stringify({
                type: "MOST_COMMON_ACCOUNTS_INSTRUCTION",
                query: {
                  programId: "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN",
                  accountName: "owner",
                  filter: {
                    or: [
                      {
                        type: "INSTRUCTION_NAME",
                        instructionName: "burn",
                      },
                    ],
                    and: {
                      type: "INSTRUCTION_ACCOUNT",
                      accountPubKey: wallet.wallet,
                      accountName: "leafOwner",
                    },
                  },
                  sort: {
                    order: "desc",
                  },
                  timeRange: {
                    after: thirtyDaysAgo,
                  },
                  limit: 1,
                },
              }),
            })
          ).json()) as any;
          if (response.error) {
            throw new Error(response.error);
          } else {
            wallet.bgumBurn = response.response.values[0]?.count || 0;
          }
          return wallet;
        })
      ))
    );
  }
  return newWalletArray;
}
