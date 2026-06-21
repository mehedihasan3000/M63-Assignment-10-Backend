const express = require('express');
const app = express()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 8000

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})


const uri = process.env.MONGODB_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const database = client.db("final_project");
        const users = database.collection("user");
        const donationrequests = database.collection("donationrequests");

        app.post('/api/create-donation-request', async (req, res) => {
            const donationRequest = req.body;
            const newDonationRequest = {
                ...donationRequest,
                createdAt: new Date(),
            }
            //console.log("new donation request", newDonationRequest)
            const result = await donationrequests.insertOne(newDonationRequest);
            res.send(result);
        })

        app.patch('/api/donation-request/:id', async (req, res) => {
            const id = req.params.id;
            const donationRequest = req.body;
            const query = { _id: new ObjectId(id) };
            const updatedDonationRequest = {
                $set: {
                    ...donationRequest,
                }
            }
            const result = await donationrequests.updateOne(query, updatedDonationRequest);
            res.send(result);
        })

        // user update patch api
        app.patch('/api/user/:id', async (req, res) => {
            const id = req.params.id;
            const user = req.body;
            console.log(user)
            const query = { _id: new ObjectId(id) };
            const updatedUser = {
                $set: {
                    ...user,
                }
            }
            const result = await users.updateOne(query, updatedUser);
            res.send(result);
        })

        app.get("/api/donation-requests/recent", async (req, res) => {
            const email = req.query.email;
            const query = {
                requesterEmail: email
            };
            const cursor = donationrequests.find(query).sort({ createdAt: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})