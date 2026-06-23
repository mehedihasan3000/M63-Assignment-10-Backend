const express = require('express');
const app = express()
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
        const { payload } = await jwtVerify(token, JWKS)
        //console.log(payload)
        next();
    }
     catch (error) {
        return res.status(403).json({ message: 'Forbidden' });
    }
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const database = client.db("final_project");
        const users = database.collection("user");
        const donationrequests = database.collection("donationrequests");

        app.post('/api/create-donation-request', verifyToken, async (req, res) => {
            const donationRequest = req.body;
            const newDonationRequest = {
                ...donationRequest,
                createdAt: new Date(),
            }
            //console.log("new donation request", newDonationRequest)
            const result = await donationrequests.insertOne(newDonationRequest);
            res.send(result);
        })

        app.patch('/api/donation-request/:id', verifyToken, async (req, res) => {
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
        app.patch('/api/user/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const user = req.body;
            //console.log(user)
            const query = { _id: new ObjectId(id) };
            const updatedUser = {
                $set: {
                    ...user,
                }
            }
            const result = await users.updateOne(query, updatedUser);
            res.send(result);
        })

        // update user role or status
        app.patch('/api/user/role-status/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updatedUser = {
                $set: {
                    ... req.body
                }
            }
            const result = await users.updateOne(query, updatedUser);
            res.send(result);
        })

        app.get("/api/all-users", verifyToken, async (req, res) => {
            const cursor = users.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/api/donation-requests/recent", verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = {
                requesterEmail: email
            };
            const cursor = donationrequests.find(query).sort({ createdAt: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })

        // all donationrequests get api
        app.get('/api/all-blood-donation-requests', async (req, res) => {
            const cursor = donationrequests.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // get search blood doners api
        app.get('/api/donors/search', async (req, res) => {
            const query = req.query;
            console.log(query)
            const filter = {
                bloodGroup: query.bloodGroup,
                district: query.district,
                upazila: query.upazila,
                status: "active"
            };
            const result = await users.find(filter).toArray();
            res.send(result);
        })

        // all pending donationrequests get api
        app.get('/api/pending-donation-requests', async (req, res) => {
            const query = {
                donationStatus: 'pending'
            }
            const cursor = donationrequests.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // get single donation request details
        app.get('/api/donation-request/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            //console.log(req.headers.authorization, "token")
            const query = { _id: new ObjectId(id) };
            const result = await donationrequests.findOne(query);
            res.send(result);
        })

        // delete donation request api
        app.delete('/api/donations/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await donationrequests.deleteOne(query);
            //console.log('delete result',result)
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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