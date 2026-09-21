require("dotenv").config(); // Load environment variables from .env

var express = require("express");
var cors = require("cors");
var app = express();
var fs = require("fs");
var bcrypt = require("bcrypt");
var bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT;
const host = "localhost";

const url = process.env.MONGO_URI;
const dbName = "CALLICOM";

function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Replace with your actual admin username
    if (decoded.userName !== "Spinypine") {
      return res.status(403).json({ error: "Not authorized" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.listen(port, () => {
  console.log("App listening at http://%s:%s", host, port);
});

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract the token from 'Authorization: Bearer <token>'

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = decoded; // Attach decoded user info to the request object
    next();
  });
};

app.post("/api/login", async (req, res) => {
  const { userName, password } = req.body;

  try {
    // Connect to the database
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users"); // Correct collection reference

    const user = await users.findOne({ userName }); // Use the correct collection

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPass);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, userName: user.userName },
      process.env.JWT_SECRET, // This should now correctly pull the secret from .env
      { expiresIn: "15d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token, // Send the JWT token to the frontend
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// User Signup route
app.post("/api/signup", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    const { email, userName, password } = req.body;

    if (!email || !userName || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const existingUser = await users.findOne({ userName });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Username already taken" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = { email, userName, hashedPass };
    await users.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    await client.close();
  }
});

app.get("/api/ping", async (req, res) => {
  res.send("[lawnmower noises]");
});

app.get("/api/campaignEquipment", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("campaignEquipment");

    const equipment = await collection.find().toArray();
    res.status(200).json(equipment);
  } catch (err) {
    console.error("Error fetching equipment:", err.message);
    res.status(500).json({ error: "Failed to fetch equipment" });
  } finally {
    await client.close();
  }
});

app.get("/api/lore", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("loreDocs");

    const lore = await collection.find().toArray();
    res.status(200).json(lore);
  } catch (err) {
    console.error("Error fetching archives:", err.message);
    res.status(500).json({ error: "Failed to fetch lore archives" });
  } finally {
    await client.close();
  }
});

app.use(authenticateJWT); // All routes after this require JWT authentication

// ---- Campaign ownership / access -------------------------------------------
//
// A campaign is visible to a user when they:
//   - own it (`ownerId` === their userName; campaigns created before
//     ownership existed have no `ownerId` and belong to ADMIN_USER),
//   - have a character whose `campaignId` list includes its join code, or
//   - have redeemed its join code (the campaign's Mongo `_id` is stored on the
//     user as `joinedCampaigns`).
// ADMIN_USER can see and manage everything.
//
// Join codes are generated once when a campaign is created and never change.
// Missions point at their campaign through `campaignId`, the campaign's Mongo
// `_id` as a string.
const ADMIN_USER = "Spinypine";

const isAdminUser = (user) => user?.userName === ADMIN_USER;

const ownsCampaign = (campaign, user) =>
  isAdminUser(user) || (campaign.ownerId || ADMIN_USER) === user?.userName;

const generateJoinCode = () => crypto.randomBytes(4).toString("hex").toUpperCase();

const normalizeJoinCode = (code) =>
  String(code || "").replace(/\s/g, "").toUpperCase();

const toObjectId = (value) =>
  typeof value === "string" && ObjectId.isValid(value) && String(new ObjectId(value)) === value
    ? new ObjectId(value)
    : null;

// A character's "Assign To Campaign" field holds a comma-separated list of
// join codes, matched case-insensitively. Returns the `_id` strings of every
// campaign the user can preview through a character or a redeemed code.
async function getVisibleCampaignIds(db, userName) {
  const [characters, user, campaigns] = await Promise.all([
    db.collection("characters").find({ userId: userName }, { projection: { campaignId: 1 } }).toArray(),
    db.collection("users").findOne({ userName }, { projection: { joinedCampaigns: 1 } }),
    db.collection("campaigns").find({}, { projection: { joinCode: 1 } }).toArray(),
  ]);

  const codes = new Set();
  for (const char of characters) {
    if (typeof char.campaignId !== "string") continue;
    char.campaignId
      .split(",")
      .map(normalizeJoinCode)
      .filter(Boolean)
      .forEach((code) => codes.add(code));
  }

  const ids = new Set(user?.joinedCampaigns || []);
  for (const c of campaigns) {
    if (c.joinCode && codes.has(c.joinCode)) ids.add(String(c._id));
  }
  return ids;
}

const canSeeCampaign = (campaign, user, visibleIds) =>
  ownsCampaign(campaign, user) || visibleIds.has(String(campaign._id));

// Owners/admin get the join code (generated lazily for legacy campaigns);
// everyone else never sees it.
async function serializeCampaign(collection, campaign, user) {
  const isOwner = ownsCampaign(campaign, user);
  const { joinCode, ...rest } = campaign;
  if (!isOwner) return { ...rest, isOwner };

  let code = joinCode;
  if (!code) {
    code = generateJoinCode();
    await collection.updateOne({ _id: campaign._id }, { $set: { joinCode: code } });
  }
  return { ...rest, ownerId: campaign.ownerId || ADMIN_USER, joinCode: code, isOwner };
}

async function canManageCampaignById(db, campaignId, user) {
  if (isAdminUser(user)) return true;
  if (!campaignId) return false;
  const campaign = await db.collection("campaigns").findOne({ id: campaignId });
  return !!campaign && ownsCampaign(campaign, user);
}

// A mission's `campaignId` is the campaign's `_id` string. Missions written
// before that change embedded the whole campaign object instead; those are
// resolved through the campaign's custom `id` (or embedded `_id`) until the
// migration script has rewritten them.
async function findMissionCampaign(db, campaignRef) {
  if (typeof campaignRef === "string") {
    const _id = toObjectId(campaignRef);
    return _id ? db.collection("campaigns").findOne({ _id }) : null;
  }
  if (campaignRef && typeof campaignRef === "object") {
    const _id = toObjectId(campaignRef._id);
    if (_id) return db.collection("campaigns").findOne({ _id });
    if (campaignRef.id) return db.collection("campaigns").findOne({ id: campaignRef.id });
  }
  return null;
}

async function canManageMissionCampaign(db, campaignRef, user) {
  if (isAdminUser(user)) return true;
  const campaign = await findMissionCampaign(db, campaignRef);
  return !!campaign && ownsCampaign(campaign, user);
}

app.get("/api/campaigns", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("campaigns");

    const all = await collection.find().toArray();
    const visibleIds = await getVisibleCampaignIds(db, req.user.userName);
    const visible = all.filter((c) => canSeeCampaign(c, req.user, visibleIds));

    // `isGuest` marks campaigns on the list because the user redeemed a code,
    // which are the ones they can leave.
    const me = await db
      .collection("users")
      .findOne({ userName: req.user.userName }, { projection: { joinedCampaigns: 1 } });
    const joined = new Set(me?.joinedCampaigns || []);

    res.status(200).json(
      await Promise.all(
        visible.map(async (c) => ({
          ...(await serializeCampaign(collection, c, req.user)),
          isGuest: joined.has(String(c._id)),
        }))
      )
    );
  } catch (err) {
    console.error("Error fetching campaigns:", err.message);
    res.status(500).json({ error: "Failed to fetch campaigns" });
  } finally {
    await client.close();
  }
});

// Any logged-in user can create a campaign; they become its owner.
app.post("/api/campaigns", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("campaigns");

    const { _id, isOwner, ownerId, joinCode, ...fields } = req.body;
    if (!fields.id || typeof fields.id !== "string" || !fields.id.trim()) {
      return res.status(400).json({ error: "Campaign ID is required" });
    }
    if (await collection.findOne({ id: fields.id })) {
      return res.status(409).json({ error: "A campaign with this ID already exists" });
    }

    let code = generateJoinCode();
    while (await collection.findOne({ joinCode: code })) code = generateJoinCode();

    const campaign = { ...fields, ownerId: req.user.userName, joinCode: code };
    const result = await collection.insertOne(campaign);
    res.status(201).json({ _id: result.insertedId, id: campaign.id, joinCode: code });
  } catch (err) {
    console.error("Error adding campaign:", err.message);
    res.status(500).json({ error: "Failed to add campaign" });
  } finally {
    await client.close();
  }
});

// Redeem a join code to preview someone else's campaign.
app.post("/api/campaigns/join", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);

    const code = normalizeJoinCode(req.body?.code);
    const campaign = code && (await db.collection("campaigns").findOne({ joinCode: code }));
    if (!campaign) return res.status(404).json({ error: "Invalid campaign code" });

    await db
      .collection("users")
      .updateOne(
        { userName: req.user.userName },
        { $addToSet: { joinedCampaigns: String(campaign._id) } }
      );

    res.status(200).json({ _id: campaign._id, id: campaign.id });
  } catch (err) {
    console.error("Error joining campaign:", err.message);
    res.status(500).json({ error: "Failed to join campaign" });
  } finally {
    await client.close();
  }
});

// Remove a campaign you previewed via its code from your list. This doesn't
// affect campaigns you own or ones shown through a character's assigned code.
app.delete("/api/campaigns/:id/join", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);

    const campaign = await db.collection("campaigns").findOne({ id: req.params.id });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    await db
      .collection("users")
      .updateOne(
        { userName: req.user.userName },
        { $pull: { joinedCampaigns: String(campaign._id) } }
      );
    res.status(200).json({ message: "Left campaign" });
  } catch (err) {
    console.error("Error leaving campaign:", err.message);
    res.status(500).json({ error: "Failed to leave campaign" });
  } finally {
    await client.close();
  }
});

app.put("/api/campaigns/:id", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("campaigns");

    if (!(await canManageCampaignById(db, req.params.id, req.user))) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Identity, ownership and access fields are never editable through this route.
    const { _id, id, isOwner, ownerId, joinCode, ...update } = req.body;

    const result = await collection.updateOne(
      { id: req.params.id },
      { $set: update }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Campaign not found" });
    res.status(200).json({ message: "Campaign updated" });
  } catch (err) {
    console.error("Error updating campaign:", err);
    res.status(500).json({ error: "Failed to update campaign" });
  } finally {
    await client.close();
  }
});

// Deleting a campaign also deletes its missions. Owner or admin only.
app.delete("/api/campaigns/:id", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);

    const campaign = await db.collection("campaigns").findOne({ id: req.params.id });
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (!ownsCampaign(campaign, req.user)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const mongoId = String(campaign._id);
    await db.collection("campaigns").deleteOne({ _id: campaign._id });

    // Missions reference the campaign by `_id` string; legacy ones still embed
    // the campaign object.
    const missionResult = await db.collection("missions").deleteMany({
      $or: [
        { campaignId: mongoId },
        { "campaignId._id": mongoId },
        { "campaignId.id": campaign.id },
      ],
    });

    // Drop the campaign from anyone who had redeemed its code.
    await db
      .collection("users")
      .updateMany({ joinedCampaigns: mongoId }, { $pull: { joinedCampaigns: mongoId } });

    res.status(200).json({
      message: "Campaign deleted",
      deletedMissions: missionResult.deletedCount,
    });
  } catch (err) {
    console.error("Error deleting campaign:", err.message);
    res.status(500).json({ error: "Failed to delete campaign" });
  } finally {
    await client.close();
  }
});

app.get("/api/missions", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);

    const campaigns = await db.collection("campaigns").find().toArray();
    const visibleIds = await getVisibleCampaignIds(db, req.user.userName);
    const allowed = campaigns.filter((c) => canSeeCampaign(c, req.user, visibleIds));
    const allowedById = new Set(allowed.map((c) => String(c._id)));
    // Legacy missions embed the campaign object; map them onto its `_id`.
    const idByCustomId = new Map(campaigns.map((c) => [c.id, String(c._id)]));

    const missions = await db.collection("missions").find().toArray();
    const result = [];
    for (const m of missions) {
      const ref = m.campaignId;
      const campaignId =
        typeof ref === "string"
          ? ref
          : toObjectId(ref?._id)
            ? ref._id
            : idByCustomId.get(ref?.id);
      if (campaignId && allowedById.has(campaignId)) result.push({ ...m, campaignId });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching missions:", err.message);
    res.status(500).json({ error: "Failed to fetch missions" });
  } finally {
    await client.close();
  }
});

// Characters assigned to one campaign. A character's `campaignId` is a
// comma-separated list of join codes, so match the code as a whole list entry.
app.get("/api/campaigns/:id/characters", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);

    const campaign = await db.collection("campaigns").findOne({ id: req.params.id });
    const visibleIds = await getVisibleCampaignIds(db, req.user.userName);
    // Same 404 for "doesn't exist" and "not yours" so ids can't be probed.
    if (!campaign || !canSeeCampaign(campaign, req.user, visibleIds)) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    if (!campaign.joinCode) return res.status(200).json([]);

    const characters = await db
      .collection("characters")
      .find({ campaignId: { $regex: `(^|,)\\s*${campaign.joinCode}\\s*(,|$)`, $options: "i" } })
      .toArray();
    res.status(200).json(characters);
  } catch (err) {
    console.error("Error fetching campaign characters:", err.message);
    res.status(500).json({ error: "Failed to fetch characters" });
  } finally {
    await client.close();
  }
});

//  Create new mission
app.post("/api/missions", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("missions");

    if (typeof req.body?.campaignId !== "string" || !toObjectId(req.body.campaignId)) {
      return res.status(400).json({ error: "campaignId must be a campaign _id" });
    }
    if (!(await canManageMissionCampaign(db, req.body.campaignId, req.user))) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (await collection.findOne({ id: req.body.id })) {
      return res.status(409).json({ error: "A mission with this ID already exists" });
    }

    const result = await collection.insertOne(req.body);
    res.status(201).json({ _id: result.insertedId });
  } catch (err) {
    console.error("Error adding mission:", err.message);
    res.status(500).json({ error: "Failed to add mission" });
  } finally {
    await client.close();
  }
});

//  Edit existing mission
app.put("/api/missions/:id", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("missions");

    // Authorize against the mission's stored campaign, and don't let an edit
    // move a mission into a campaign the user doesn't manage.
    const existing = await collection.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ error: "Mission not found" });
    if (!(await canManageMissionCampaign(db, existing.campaignId, req.user))) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const { _id, campaignId, ...body } = req.body;

    const result = await collection.updateOne(
      { id: req.params.id }, // ← custom ID match, not _id
      { $set: body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Mission not found" });
    }

    res.status(200).json({ message: "Mission updated" });
  } catch (err) {
    console.error("Error updating mission:", err.message);
    res.status(500).json({ error: "Failed to update mission" });
  } finally {
    await client.close();
  }
});

app.delete("/api/missions/:id", async (req, res) => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("missions");

    const existing = await collection.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ error: "Mission not found" });
    if (!(await canManageMissionCampaign(db, existing.campaignId, req.user))) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const result = await collection.deleteOne({ id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Mission not found" });
    }

    res.status(200).json({ message: "Mission deleted" });
  } catch (err) {
    console.error("Error deleting mission:", err.message);
    res.status(500).json({ error: "Failed to delete mission" });
  } finally {
    await client.close();
  }
});

app.post("/api/characters", async (req, res) => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);

    const character = {
      ...req.body,
      XP: req.body.XP ?? 0,
      equipment: req.body.equipment ?? {
        primaryWeapon: { name: "", category: "", family: "" },
        secondaryWeapon: { name: "", category: "", family: "" },
        grenades: ["", ""],
        gadget: "",
        gadgetAmmo: {},
        armorClass: 0,
        miscGear: "",
      },
    };

    if (!character.userId) {
      return res.status(400).send({ error: "Missing user ID" });
    }

    const result = await db.collection("characters").insertOne(character);
    res.status(201).send(result);
  } catch (err) {
    console.error("Error saving character:", err.message);
    res.status(500).send({ error: err.message });
  }
});

app.get("/api/characters/:userId", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const userId = req.params.userId;

    const characters = await collection.find({ userId }).toArray();
    res.status(200).json(characters);
  } catch (err) {
    console.error("Error fetching characters:", err.message);
    res.status(500).json({ error: "Failed to fetch characters" });
  } finally {
    await client.close();
  }
});

// Single-character routes key off (userId, uniqueId) rather than callsign:
// callsign is just a display name and nothing stops two characters from
// sharing one, which would make a callsign-keyed lookup/update/delete
// ambiguous between them. `uniqueId` is generated client-side per character
// (see CharacterCreator.jsx's createCharacterId) and is never reused.
//
// A document saved before `uniqueId` existed won't have a real one — either
// missing entirely, or normalized to "" by the frontend's
// normalizeCharacterMetadata before it round-trips back in a later PATCH —
// so the :uid param can legitimately be that old character's callsign
// instead (see syncEngine.characterKey's fallback). That callsign match only
// applies when the document has no real uniqueId of its own (covering both
// cases via Mongo's null-matches-missing behavior), so it can never shadow a
// real uniqueId match.
const singleCharacterFilter = (user, uid) => ({
  userId: user,
  $or: [
    { uniqueId: uid },
    { uniqueId: { $in: [null, ""] }, callsign: uid },
  ],
});

app.get("/api/characters/:userID/:uid", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const uniqueId = req.params.uid;
    const user = req.params.userID;

    const character = await collection.findOne(
      singleCharacterFilter(user, uniqueId),
    );
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }
    res.status(200).json(character);
  } catch (err) {
    console.error("Error fetching characters:", err.message);
    res.status(500).json({ error: "Failed to fetch characters" });
  } finally {
    await client.close();
  }
});

app.patch("/api/characters/:userID/:uid", async (req, res) => {
  const client = new MongoClient(url);
  try {
    const user = req.params.userID;
    const uniqueId = req.params.uid;

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const updates = req.body;

    const result = await collection.updateOne(
      singleCharacterFilter(user, uniqueId),
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    res.status(200).json({ message: "Character updated", uniqueId });
  } catch (err) {
    console.error("PATCH error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.close();
  }
});

app.delete("/api/characters/:userId/:uid", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const user = req.params.userId;
    const uniqueId = req.params.uid;

    const result = await collection.deleteOne(
      singleCharacterFilter(user, uniqueId),
    );

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    res.status(200).json({ message: "Character deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.close();
  }
});
