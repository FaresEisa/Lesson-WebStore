// Imported packages
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MongoClient, ServerApiVersion } from "mongodb";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); 
});

// Images from folder
app.use("/images", (req, res, next) => {
  const imagePath = path.join(process.cwd(), "images", req.url);

  // Check if image exists
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("Image not found");
    }
    res.sendFile(imagePath); // Send image file if exists
  });
});

// MongoDB Connection Setup
const userName = "fares";
const password = "52wkoW70E0j9V1eG";
const server = "fares.ozppq.mongodb.net";

// Encode credentials for URI
const encodedUsername = encodeURIComponent(userName);
const encodedPassword = encodeURIComponent(password);

// Connection string for MongoDB Atlas
const connectionURI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${server}/?retryWrites=true&w=majority`;

// Create MongoDB client
const client = new MongoClient(connectionURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

let db;

async function startServer() {
  try {
    await client.connect();
    db = client.db("OnlineStore"); // Connect to MongoDB Atlas
    console.log("Connected to MongoDB"); // From database

    // GET all lessons
    app.get("/lessons", async (req, res) => {
      try {
        const lessonsCollection = db.collection("Lessons");
        const lessons = await lessonsCollection.find().toArray(); // Fetch all lessons
        res.json(lessons); // Send lessons as JSON
      } catch (error) {
        res.status(500).json({ error: "Failed to retrieve lessons" });
      }
    });

    // Text search of topic, location, price, and spaces
    app.get("/search", async (req, res) => {
      const query = req.query.query;

      if (!query) {
        return res.status(400).json({ error: "Missing search query" });
      }

      try {
        const lessonsCollection = db.collection("Lessons");

        const results = await lessonsCollection.find({
          $or: [
            { topic: { $regex: query, $options: "i" } },
            { location: { $regex: query, $options: "i" } },
            {
              $expr: { // Convert price to string
                $regexMatch: {
                  input: { $toString: "$price" },
                  regex: query,
                  options: "i"
                }
              }
            },
            {
              $expr: { // Convert spaces to string
                $regexMatch: {
                  input: { $toString: "$spaces" },
                  regex: query,
                  options: "i"
                }
              }
            }
          ]
        }).toArray();

        res.json(results); // Send search results as JSON
      } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Failed to search lessons" });
      }
    });

    // POST orders
    app.post("/orders", async (req, res) => {
      const { firstName, phone, email, cart } = req.body;

      // Validate input
      if (!firstName || !phone || !email || !cart || cart.length === 0) {
        return res.status(400).json({ error: "Missing fields" });
      }

      try {
        const ordersCollection = db.collection("Orders");

        // Cart items to order entries
        const ordersToInsert = cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          name: firstName,
          email: email,
          phone: phone,
        }));

        const result = await ordersCollection.insertMany(ordersToInsert); // Insert orders
        res.status(201).json({ success: true, insertedCount: result.insertedCount });
      } catch (error) {
        res.status(500).json({ error: "Failed to store order" });
      }
    });

    // Updates lesson spaces
    app.put("/lessons/:id", async (req, res) => {
      const lessonId = req.params.id;
      const { quantityPurchased } = req.body;

      if (!quantityPurchased || quantityPurchased <= 0) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      try {
        const lessonsCollection = db.collection("Lessons");
        const lesson = await lessonsCollection.findOne({ id: lessonId });

        if (!lesson) {
          return res.status(404).json({ error: "Lesson not found" });
        }

        if (lesson.spaces < quantityPurchased) {
          return res.status(400).json({ error: "Not enough spaces" });
        }

        // Descrease available spaces by quantity purchased
        const updated = await lessonsCollection.updateOne(
          { id: lessonId },
          { $inc: { spaces: -quantityPurchased } }
        );

        res.json({ success: true, modifiedCount: updated.modifiedCount });
      } catch (err) {
        res.status(500).json({ error: "Failed to update lesson" });
      }
    });

    // Starts the server
    app.listen(3000, () => console.log("Server running on port 3000"));

  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

// Example URLs for testing images and lessons
// http://localhost:3000/images/math.jpg
// http://localhost:3000/lessons


startServer();
