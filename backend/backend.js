var express = require("express");
var cors = require("cors");
var app = express();
var fs = require("fs");
var bcrypt = require("bcrypt");
var bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 8080
const host = "localhost";

const url = process.env.MONGO_URI;
const dbName = "CALLICOM";

app.listen(port, () => {
  console.log("App listening at http://%s:%s", host, port);
});

app.get("/api/equipment", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("equipment");

    const equipment = await collection.find({}).toArray();
    res.status(200).json(equipment);
  } catch (err) {
    console.error("Failed to fetch equipment:", err);
    res.status(500).json({ error: "Failed to fetch equipment" });
  } finally {
    await client.close();
  }
});

app.get("/api/rules", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("rules");

    const equipment = await collection.find({}).toArray();
    res.status(200).json(equipment);
  } catch (err) {
    console.error("Failed to fetch equipment:", err);
    res.status(500).json({ error: "Failed to fetch equipment" });
  } finally {
    await client.close();
  }
});

app.post("/api/characters", async (req, res) => {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);

    const character = req.body;
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

app.get("/api/characters/:userID/:cs", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const callsign = req.params.cs;
    const user = req.params.userID;

    const character = await collection.findOne({
      callsign: callsign,
      userId: user,
    });
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

app.patch("/api/characters/:userID/:cs", async (req, res) => {
  const client = new MongoClient(url);
  try {
    const user = req.params.userID;
    const name = req.params.cs;

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const updates = req.body;

    const result = await collection.updateOne(
      { callsign: name, userId: user },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Character not found" });
    }

    res.status(200).json({ message: "Character updated", name });
  } catch (err) {
    console.error("PATCH error:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.close();
  }
});

app.delete("/api/characters/:userId/:cs", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const user = req.params.userId;
    const character = req.params.cs;

    const result = await collection.deleteOne({
      callsign: character,
      userId: user,
    });

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

app.post("/api/login", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    const { userName, password } = req.body;
    const user = await users.findOne({ userName });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPass);
    if (isMatch) {
      res.status(200).json({ success: true, message: "Login successful" });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    await client.close();
  }
});

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

    const hashedPass = await bcrypt.hash(req.body.password, 10);

    const newUser = { email, userName, hashedPass };
    await users.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      hashedPass: hashedPass,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    await client.close();
  }
});
