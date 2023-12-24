const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

//Middlewire

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0vnziom.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
      return  res.status(401).send({message:'unauthorize access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            res.status(401).send({message:'unauthorize access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('geniusCar').collection('services');
        const orderCollection = client.db('geniusCar').collection('orders');

        app.post('/jwt',  (req, res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
            res.send({token})
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            console.log(id)
            const query = {_id: new ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        // Order
        app.get('/orders', verifyJWT, async(req, res)=>{
            // console.log(req.headers);
            const decoded = req.decoded;
            console.log(decoded);
            if(decoded.email !== req.query.email){
                res.status(403).send({massage: 'unauthorized access'})
            }
            let query = {};
            console.log(req.query.email)
            if(req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.post('/orders', async(req, res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        });
        // patch
        app.patch('/orders/:id', async(req, res)=>{
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: new ObjectId(id)};
            const updateDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updateDoc)
            res.send(result)
        })
        // Delete 
        app.delete('/orders/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })
    } finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('send data')
})

app.listen(port, () => {
    console.log(`${port} is running!`)
})