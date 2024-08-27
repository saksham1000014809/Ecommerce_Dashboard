const express = require('express');
const User = require('./db/Users');
require('./db/Products');
const cors = require('cors');
const Product = require('./db/Products');
require('./db/config')
const app = express();

const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';

app.use(express.json());
app.use(cors());

app.post('/register', async (req, resp) => {
  try {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;

     //jwt ayhentication 
     Jwt.sign({result},jwtKey,{expiresIn:'2h'},(err,token)=>{
      if(err){
        resp.send({result:"Something went wrong,Please try after sometime"})
      }
      resp.send({result,auth:token});
    })
    
    console.log("Data sent successfully");
  } catch (error) {
    console.error('Error during registration:', error);
    resp.status(500).send({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, resp) => {
  try {
    if (req.body.email && req.body.password) {
      let user = await User.findOne({ email: req.body.email, password: req.body.password }).select("-password");
      if (user) {
        //jwt ayhentication 
        Jwt.sign({user},jwtKey,{expiresIn:'10h'},(err,token)=>{
          if(err){
            resp.send({result:"Something went wrong,Please try after sometime"})
          }
          resp.send({user,auth:token});
        })

      } else {
        resp.send({ result: 'No user found' });
      }
    } else {
      resp.send({ result: 'Email and password are required' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    resp.status(500).send({ error: 'Login failed' });
  }
});

app.post('/add-product', async (req, resp) => {
  try {
    let product = new Product(req.body);
    let result = await product.save();
    resp.status(201).send(result);
  } catch (error) {
    console.error('Error saving product:', error);
    resp.status(500).send({ error: 'Failed to save product' });
  }
});

app.post('/add-update', async (req, resp) => {
  // console.log('Received data:', req.body);
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result)
})

app.get('/products', async (req, resp) => {
  let products = await Product.find();
  if (products.length > 0) {
    resp.send(products)
  } else {
    resp.send({ result: "No Product found" })
  }
})

app.delete('/product/:id', async (req, resp) => {
  const result = await Product.deleteOne({ _id: req.params.id })
  resp.send(result)
  if (result) {

    console.log("Deleted Succesfully")
  } else {
    console.log(" Not Deleted Succesfully")
  }
})

app.get('/product/:id', async (req, resp) => {
  let result = await Product.findOne({ _id: req.params.id })
  if (result) {
    resp.send(result)
  } else {
    resp.send({result:"not found"})
  }
})

app.put('/product/:id',async(req,resp)=>{
  let result = await Product.updateOne({_id:req.params.id},{$set:req.body})
  resp.send(result)
})

app.get('/search/:key',verifyToken,async(req,resp)=>{
let result =await Product.find({
  "$or":[
        {name:{$regex:req.params.key}},
        {price:{$regex:req.params.key}},
        {category:{$regex:req.params.key}},
        {company:{$regex:req.params.key}}
  ]
})
// result = await result.json()
resp.send(result)
})

app.get('/profile/:id',async(req,resp)=>{
   let result = await User.findOne({_id:req.params.id})
  resp.send(result)
})

function verifyToken(req, resp, next) {
  let token = req.headers['authorization'];
  if (token) {
    token = token.split(' ')[1]; // Split the header value by space and get the second part which is the token
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp.status(401).send({ result: "Please provide valid token" });
      } else {
        next();
      }
    });
  } else {
    resp.status(403).send({ result: "Please add token with header" });
  }
}

app.listen(4200, () => {
  console.log("Server is running on port: 4200");
});
