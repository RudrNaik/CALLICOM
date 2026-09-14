/**
 * One-off migration: backfills a real `uniqueId` onto every character
 * document that predates the field (missing entirely, or an empty string —
 * see the frontend's normalizeCharacterMetadata, which can round-trip that
 * onto an old document via a later PATCH).
 *
 * Mirrors the logic in frontend/src/engine/syncEngine.js's
 * backfillMissingUniqueIds, but runs directly against the whole collection
 * instead of per-user through the API — useful when most of the affected
 * characters belong to users who may not log in to trigger the client-side
 * self-heal themselves.
 *
 * A (userId, callsign) pair shared by more than one document missing a
 * uniqueId is a genuine duplicate/ambiguous case: nothing about the two
 * documents themselves says which is which, so this script leaves them
 * untouched and lists them at the end for manual review instead of
 * guessing.
 *
 * Usage (from backend/):
 *   node migrateUniqueIds.js          # dry run — reports what it would do
 *   node migrateUniqueIds.js --apply  # actually writes the backfilled ids
 */
require("dotenv").config();
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const url = process.env.MONGO_URI;
const dbName = "CALLICOM";
const APPLY = process.argv.includes("--apply");

async function main() {
  if (!url) {
    console.error("MONGO_URI is not set (check backend/.env).");
    process.exit(1);
  }

  const client = new MongoClient(url);
  await client.connect();

  try {
    const collection = client.db(dbName).collection("characters");
    const characters = await collection.find({}).toArray();

    const hasRealId = (char) =>
      typeof char.uniqueId === "string" && char.uniqueId.length > 0;

    // Group everything missing a real id by (userId, callsign) — the same
    // pair the backend's single-character routes fall back to matching on.
    const groups = new Map();
    for (const char of characters) {
      if (hasRealId(char) || !char.callsign) continue;
      const key = `${char.userId ?? ""}::${char.callsign}`;
      const group = groups.get(key) ?? [];
      group.push(char);
      groups.set(key, group);
    }

    let backfilled = 0;
    let skippedAmbiguous = 0;
    const ambiguous = [];

    for (const [key, group] of groups) {
      if (group.length > 1) {
        skippedAmbiguous += group.length;
        ambiguous.push({ key, count: group.length, ids: group.map((c) => String(c._id)) });
        continue;
      }

      const char = group[0];
      const newId = crypto.randomUUID();
      console.log(
        `${APPLY ? "Backfilling" : "[dry run] Would backfill"} uniqueId for ` +
          `${char.userId ?? "(no userId)"} / ${char.callsign} (_id ${char._id}) -> ${newId}`,
      );

      if (APPLY) {
        await collection.updateOne({ _id: char._id }, { $set: { uniqueId: newId } });
      }
      backfilled += 1;
    }

    console.log("");
    console.log(`Total characters scanned: ${characters.length}`);
    console.log(`${APPLY ? "Backfilled" : "Would backfill"}: ${backfilled}`);
    if (ambiguous.length > 0) {
      console.log(`Skipped (ambiguous — same userId+callsign, needs manual review): ${skippedAmbiguous}`);
      ambiguous.forEach(({ key, count, ids }) => {
        console.log(`  - ${key}: ${count} documents, _id(s): ${ids.join(", ")}`);
      });
    } else {
      console.log("No ambiguous duplicates found.");
    }
    if (!APPLY) {
      console.log("");
      console.log("Dry run only — re-run with --apply to write these changes.");
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
