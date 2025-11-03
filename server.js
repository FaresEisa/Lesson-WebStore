import { MongoClient, ServerApiVersion } from "mongodb";

// MongoDB connection
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

//Vue products array
const products = [
  { id: "1001", subject: "Math", price: 100, location: "Newport", availableItems: 8, maxItems: 8 },
  { id: "1002", subject: "English", price: 90, location: "London", availableItems: 9, maxItems: 9 },
];

// Convert products to match Lessons collection structure
const lessons = products.map(product => ({
  id: product.id,
  topic: product.subject,
  price: product.price,
  location: product.location,
  spaces: product.availableItems
}));

//insert lessons to mongoDb
async function insertLessons() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("OnlineStore");
    const lessonsCollection = database.collection("Lessons");

    // Insert all lessons
    const result = await lessonsCollection.insertMany(lessons);
    console.log(`${result.insertedCount} lessons inserted successfully`);
  } catch (error) {
    console.error("Error inserting lessons:", error);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}
insertLessons();
