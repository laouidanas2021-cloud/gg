import { getStore } from "@netlify/blobs";

// One tiny blob per vote (key = "<name>/<timestamp>-<uuid>"), so two people voting
// at the same moment can never overwrite each other. Totals = number of blobs per name.
const NAMES = [
  "ninja", "mina", "ziko", "itacha", "mitrox", "atr", "aura", "aurlia",
  "old", "swight", "makiller", "bimo", "marven", "salma", "malak",
];
const KEYS = [...NAMES, "say"];

async function countAll(store) {
  const counts = Object.fromEntries(KEYS.map((k) => [k, 0]));
  for await (const page of store.list({ paginate: true })) {
    for (const b of page.blobs) {
      const k = b.key.split("/")[0];
      if (k in counts) counts[k]++;
    }
  }
  return counts;
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const store = getStore("mloka");

  if (req.method === "POST") {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {}
    if (!KEYS.includes(body.key)) return json({ error: "unknown key" }, 400);
    await store.set(body.key + "/" + Date.now() + "-" + crypto.randomUUID(), "1");
  } else if (req.method !== "GET") {
    return json({ error: "method not allowed" }, 405);
  }

  return json({ counts: await countAll(store) });
};

export const config = { path: "/api/votes" };
