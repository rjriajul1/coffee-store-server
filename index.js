const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const admin = require("firebase-admin");
// const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const verifyJWT = async (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.tokenEmail = decoded.email;
    next()
  } catch {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  // jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
  //   if (err) {
  //     return res.status(401).send({ message: "Unauthorized access" });
  //   }
  //   if (decoded) {
  //     req.tokenEmail = decoded.email;
  //     next();
  //   }
  // });
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const coffeeCollection = client.db("coffeeDB").collection("coffees");
    const userCollection = client.db("coffeeDB").collection("users");
    const orderCollection = client.db("coffeeDB").collection("orders");

    // app.post("/jwt", (req, res) => {
    //   const email = req.body.email;
    //   const token = jwt.sign({ email }, process.env.SECRET_KEY, {
    //     expiresIn: "4d",
    //   });
    //   res.send(token);
    // });

    app.get("/coffees", async (req, res) => {
      const cursor = coffeeCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coffeeCollection.findOne(query);
      res.send(result);
    });

    app.get("/coffeesByEmail", verifyJWT, async (req, res) => {
      const tokenEmail = req.tokenEmail;
      const email = req.query.email;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const filter = { email: email };
      const result = await coffeeCollection.find(filter).toArray();
      res.send(result);
    });

    app.post("/coffees", async (req, res) => {
      const newCoffee = req.body;
      const quantity = newCoffee.quantity;
      newCoffee.quantity = parseInt(quantity);
      const result = await coffeeCollection.insertOne(newCoffee);
      res.status(201).send(result);
      // console.log('added new coffee server side',newCoffee);
    });

    app.put("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const coffee = req.body;
      const updateDoc = {
        $set: coffee,
      };
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const result = await coffeeCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.patch("/like/:coffeeId", async (req, res) => {
      const id = req.params.coffeeId;
      const email = req.body.email;
      const query = { _id: new ObjectId(id) };
      const coffee = await coffeeCollection.findOne(query);
      const alreadyLike = coffee?.likeBy.includes(email);

      const updatedDoc = alreadyLike
        ? {
            $pull: {
              likeBy: email,
            },
          }
        : {
            $addToSet: {
              likeBy: email,
            },
          };
      await coffeeCollection.updateOne(query, updatedDoc);

      res.send({
        message: alreadyLike ? "dislike Successfully" : "liked successfully",
        liked: !alreadyLike,
      });
    });

    app.delete("/coffees/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coffeeCollection.deleteOne(query);
      res.send(result);
    });

    // order api
    app.post("/order-place/:coffeeId", async (req, res) => {
      const id = req.params.coffeeId;
      const orderData = req.body;
      const result = await orderCollection.insertOne(orderData);
      if (result.acknowledged) {
        await coffeeCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $inc: {
              quantity: -1,
            },
          }
        );
      }
      res.send(result);
    });

    app.get("/my-orders/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const tokenEmail = req.tokenEmail;
      if (tokenEmail !== email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const filter = {
        userEmail: email,
      };
      const result = await orderCollection.find(filter).toArray();
      for (const orders of result) {
        const orderId = orders.orderId;
        const query = { _id: new ObjectId(orderId) };
        const order = await coffeeCollection.findOne(query);
        orders.name = order?.name;
        orders.quantity = order?.quantity;
        orders.supplier = order?.supplier;
        orders.taste = order?.taste;
        orders.price = order?.price;
        orders.photo = order?.photo;
        orders.details = order?.details;
      }
      res.send(result);
    });

    // user api
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      const { email, lastSignInTime } = req.body;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          lastSignInTime: lastSignInTime,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send({ message: "successfully delete", data: result });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("coffee server is running");
});

app.listen(port, () => {
  console.log(`coffee server is running on port ${port}`);
});
