const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    });
};

async function run() {
  try {
    const db = client.db("mediqueueDB");
    const tutorsCollection = db.collection("tutors");
    const bookedSessionsCollection = db.collection("bookedSessions");

    app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' });
        res.send({ token });
    });

    app.post('/tutors', verifyToken, async (req, res) => {
      const newTutor = req.body;
      newTutor.createdAt = new Date().toISOString();
      const result = await tutorsCollection.insertOne(newTutor);
      res.send(result);
    });

    app.get('/tutors', async (req, res) => {
      const { search, startDate, endDate } = req.query;
      let query = {};

      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate).toISOString();
        }
        if (endDate) {
            query.createdAt.$lte = new Date(endDate).toISOString();
        }
      }

      const cursor = tutorsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    
    app.get('/tutors/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    });

    app.get('/my-tutors', verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.email !== email) {
          return res.status(403).send({ error: true, message: 'forbidden access' });
      }
      const query = { userEmail: email };
      const result = await tutorsCollection.find(query).toArray();
      res.send(result);
    });

    app.patch('/tutors/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          price: updatedData.price,
          phone: updatedData.phone,
          description: updatedData.description,
          image: updatedData.image,
        },
      };
      const result = await tutorsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/tutors/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.deleteOne(query);
      res.send(result);
    });

    app.post('/booked-sessions', verifyToken, async (req, res) => {
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

    app.get('/booked-sessions', verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.decoded.email !== email) {
          return res.status(403).send({ error: true, message: 'forbidden access' });
      }
      app.delete('/booked-sessions/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookedSessionsCollection.deleteOne(query);
      res.send(result);
    });
      const query = { userEmail: email };
      const result = await bookedSessionsCollection.find(query).toArray();
      res.send(result);
    });

  } finally {
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('MediQueue Server is running perfectly...');
});

app.listen(port, () => {
});