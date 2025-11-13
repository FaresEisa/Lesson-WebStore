import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MongoClient, ServerApiVersion } from "mongodb";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const password = "52wkoW70E0j9V1eG";
const userName = "fares";
const server = "fares.ozppq.mongodb.net";

const encodedUsername = encodeURIComponent(userName);
const encodedPassword = encodeURIComponent(password);

const connectionURI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${server}/?retryWrites=true&w=majority`;

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
    db = client.db("OnlineStore");
    console.log("Connected to MongoDB");

    // GET all lessons
    app.get("/lessons", async (req, res) => {
      try {
        const lessonsCollection = db.collection("Lessons");
        const lessons = await lessonsCollection.find().toArray();
        res.json(lessons);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        res.status(500).json({ error: "Failed to retrieve lessons" });
      }
    });

    // POST orders
    app.post("/orders", async (req, res) => {
      const { firstName, phone, email, cart } = req.body;

      if (!firstName || !phone || !email || !cart || cart.length === 0) {
        return res.status(400).json({ error: "Missing fields or empty cart" });
      }

      try {
        const ordersCollection = db.collection("Orders");
        const ordersToInsert = cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          name: firstName,
          email: email,
          phone: phone,
        }));

        const result = await ordersCollection.insertMany(ordersToInsert);
        res.status(201).json({ success: true, insertedCount: result.insertedCount });
      } catch (error) {
        console.error("Error inserting order:", error);
        res.status(500).json({ error: "Failed to store order" });
      }
    });

    // PUT: update lesson spaces after order
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
          return res.status(400).json({ error: "Not enough available spaces" });
        }

        const updated = await lessonsCollection.updateOne(
          { id: lessonId },
          { $inc: { spaces: -quantityPurchased } }
        );

        res.json({ success: true, modifiedCount: updated.modifiedCount });
      } catch (err) {
        console.error("Error updating lesson:", err);
        res.status(500).json({ error: "Failed to update lesson" });
      }
    });

    app.listen(3000, () => console.log("Server running on port 3000"));
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

// node server.js
// http://localhost:3000/lessons

startServer();

