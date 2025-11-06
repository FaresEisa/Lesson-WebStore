import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MongoClient, ServerApiVersion } from "mongodb";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection setup
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

// Connect to MongoDB
async function connectToDatabase() {
  await client.connect();
  db = client.db("OnlineStore");
  console.log("Connected to MongoDB");
}
connectToDatabase();

// Post for orders
app.post("/orders", async (req, res) => {
  const { firstName, phone, email, cart } = req.body;

  if (!firstName || !phone || !email || !cart || cart.length === 0) {
    return res.status(400).json({ error: "Missing fields or empty cart" });
  }

  try {
    const ordersCollection = db.collection("Orders");

    // Transform the cart items into individual order entries
    const ordersToInsert = cart.map(item => ({
      id: item.id,                 // lesson id
      quantity: item.quantity,     // number of lessons
      name: firstName,             // customer's name
      email: email,                // customer's email
      phone: phone,                // customer's phone number
    }));

    // Insert all orders
    const result = await ordersCollection.insertMany(ordersToInsert);

    res.status(201).json({
      success: true,
      insertedCount: result.insertedCount
    });

  } catch (error) {
    console.error("Error inserting order:", error);
    res.status(500).json({ error: "Failed to store order" });
  }
});

// Start the server
app.listen(3000, () => console.log("Server running on port 3000"));

