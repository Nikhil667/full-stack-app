// console.log("first")
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
} 

const express = require("express");
const app = express();
const bodyParser = require('body-parser');

var cors = require('cors')
const stripe = require('stripe')(process.env.STRIPE_ID)

const dbConnect = require("./database/dbConnect");
const User = require("./database/userModel");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const auth = require("./auth");

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dbConnect();

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.post("/checkout", async (request, response) => {
  /*
    req.body.items
    [
        {
            id: 1,
            quantity: 3
        }
    ]
    stripe wants
    [
        {
            price: 1,
            quantity: 3
        }
    ]
    */
    console.log(request.body);
    const items = request.body.items;
    let lineItems = [];
    items.forEach((item)=> {
        lineItems.push(
            {
                price: item.id,
                quantity: item.quantity
            }
        )
    });

    const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        success_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel"
    });

    response.send(JSON.stringify({
        url: session.url
    }));

})

app.post("/register", (request, response) => {
    bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        password: hashedPassword,
      });

      // save the new user
      user
        .save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            message: "User Created Successfully",
            result,
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((error) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        error,
      });
    });
  
});

app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })
  // if email exists
  .then((userFound) => {
    // compare the password entered and the hashed password found
    bcrypt.compare(request.body.password, userFound.password)
     // if the passwords match
    .then((passwordCheck) => {
      // check if password matches
      if(!passwordCheck){
        return response.status(400).send({
          message: "Password does not match",
          error,
        })
      }
      //   create JWT token
      const token = jwt.sign(
        {
          userId: userFound._id,
          userEmail: userFound.email,
        },
        "RANDOM-TOKEN",
        {
          expiresIn: "24h"
        }
      )
      //   return success response
      response.status(200).send({
        message: "Login Successful",
        email: userFound.email,
        token,
      });
    })
    // catch error if password does not match
    .catch((error) => {
      response.status(400).send({
        message: "Passwords does not match",
        error,
      });
    })
  })
  // catch error if email does not exist
  .catch((e) => {
    response.status(404).send({
      message: "Email not found",
      e,
    });
  });
})

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! asd This is your server response!" });
  next();
});

// free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "You are authorized to access me" });
});


module.exports = app;

