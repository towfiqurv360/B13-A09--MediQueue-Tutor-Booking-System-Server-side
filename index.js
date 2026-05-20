const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdzsqam.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const db = client.db("mediqueueDB");
    const tutorsCollection = db.collection("tutors");
    const bookedSessionsCollection = db.collection("bookedSessions");

   
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
    
    app.get('/tutors/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    });

    app.get('/my-tutors', async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await tutorsCollection.find(query).toArray();
      res.send(result);
    });

    app.patch('/tutors/:id', async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          price: updatedData.price,
          phone: updatedData.phone,
          description: updatedData.description,
        },
      };
      const result = await tutorsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/tutors/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.deleteOne(query);
      res.send(result);
    });

   
    app.post('/booked-sessions', async (req, res) => {
      const sessionData = req.body;
      
      const query = { 
        tutorId: sessionData.tutorId, 
        userEmail: sessionData.userEmail 
      };
      
      const alreadyBooked = await bookedSessionsCollection.findOne(query);

      if (alreadyBooked) {
        return res.send({ insertedId: null, message: "Already booked! You have already registered for this session." });
      }

      const result = await bookedSessionsCollection.insertOne(sessionData);
      res.send(result);
    });

    app.get('/booked-sessions', async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await bookedSessionsCollection.find(query).toArray();
      res.send(result);
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('MediQueue Server is running perfectly...');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});