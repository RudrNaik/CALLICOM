require("dotenv").config(); // Load environment variables from .env

var express = require("express");
var cors = require("cors");
var app = express();
var fs = require("fs");
var bcrypt = require("bcrypt");
var bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT
const host = "localhost";

const url =
  process.env.MONGO_URI;
const dbName = "CALLICOM";

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
      { expiresIn: "20h" }
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

app.get("/api/campaigns", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("campaigns");

    const characters = await collection.find().toArray();
    res.status(200).json(characters);
  } catch (err) {
    console.error("Error fetching campaigns:", err.message);
    res.status(500).json({ error: "Failed to fetch characters" });
  } finally {
    await client.close();
  }
});

app.get("/api/missions", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("missions");

    const characters = await collection.find().toArray();
    res.status(200).json(characters);
  } catch (err) {
    console.error("Error fetching missions:", err.message);
    res.status(500).json({ error: "Failed to fetch characters" });
  } finally {
    await client.close();
  }
});

app.use(authenticateJWT); // All routes after this will require authentication

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

app.get("/api/characters", async (req, res) => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("characters");

    const characters = await collection.find().toArray();
    res.status(200).json(characters);
  } catch (err) {
    console.error("Error fetching characters:", err.message);
    res.status(500).json({ error: "Failed to fetch characters" });
  } finally {
    await client.close();
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
