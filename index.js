const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://MediQueue:F4XhFIR4jCdK7pDo@cluster0.pdzsqam.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const db = client.db("mediqueueDB");
    const tutorsCollection = db.collection("tutors");

    app.post('/tutors', async (req, res) => {
      const newTutor = req.body;
      const result = await tutorsCollection.insertOne(newTutor);
      res.send(result);
    });

    app.get('/tutors', async (req, res) => {
      const cursor = tutorsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

  } finally {
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('MediQueue Server is running...');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});