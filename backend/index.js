//backend process complete with all packages loaded 
const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

//middleware

app.use(express.json());
app.use(cors());

//connect to mongodb
mongoose.connect("mongodb+srv://nagasaibalam:abcd1234@cluster0.kso60hi.mongodb.net/tutorials")

//api creation
app.get("/",(req,res)=>{
    res.send("express app is running");
})

// Route for Images folder
app.use('/images', express.static('upload/images'));
  
//image storage engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
      return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
  })
  const upload = multer({ storage: storage })
  app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
      success: 1,
      image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
  })
  
  
  
  

//schema for creating products 
const Product = mongoose.model("Product",{
    id:{
        type:Number,
        required:true
    },
    name:{
        type:String,
        required:true
    },image:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    new_price:{
        type:Number,
        required:true
    },
    old_price:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        default:Date.now()
    },
    avilable:{
        type:Boolean,
        default:true
    }
})
//add product end point 
app.post('/addproduct',async(req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length > 0){
        let last_product_array = products.slice(-1);
        let last_product= last_product_array[0];
        id=last_product.id+1;
    }else{
        id=1;
    }
        try{
            const product =  new Product({
                id:id,
                name:req.body.name,
                image:req.body.image,
                category:req.body.category,
                new_price:req.body.new_price,
                old_price:req.body.old_price
            });
            console.log(product);
            await product.save();
            console.log("saved");
            res.json({message:"product added successfully"})
        }catch(error){
            res.json({error:error.message})
        }
})

//removing the data from the database ki endpoint called remove;
app.delete('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("removed");
    res.json({name:req.body.name,message:"product removed successfully"})
})

//get all the products from the database (endpoint)
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All Products");
  res.send(products);
});



// Schema for creating user model
const Users = mongoose.model("Users", {
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    cartData: { type: Object },
    date: { type: Date, default: Date.now() },
  });

  //Create an endpoint at ip/auth for regestring the user & sending auth-token
app.post('/signup', async (req, res) => {
    console.log("Sign Up");
    let success = false;
    //finding the user having the existing account or not 
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({ success: success, errors: "existing user found with this email" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }
    const user = new Users({
      name: req.body.username,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });
    await user.save();
    const data = {
      user: {
        id: user.id
      }
    }
  
    const token = jwt.sign(data, 'secret_ecom');
    success = true;
    res.json({ success, token })
  })
  
  //creating endpoint for the user login
  app.post('/login', async (req, res) => {
    console.log("Login");
    let success = false;
    let user = await Users.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ success: success, errors: "User not found" });
    }
    if (user.password  !== req.body.password) {
      return res.status(400).json({ success: success, errors: "Incorrect password" });
    }
    const data = {
      user: {
        id: user.id
      }
    }
  
    const token = jwt.sign(data,'secret_ecom');
    success = true;
    res.json({ success, token })
  })


  //creating end point for₹ the new collections data
  app.get('/newcollections',async(req,res)=>{
        let products = await Product.find({});
        let newcollection = products.slice(1).slice(-8);
        console.log("new collection fetched");
        res.send(newcollection);
  })

  //creating endpoint for popular in women section
  app.get('/popularinwomen',async(req,res)=>{
            let products = await Product.find({category:"women"});
            let popular_in_women = products.slice(0,4);
            console.log("popular in women fetched");
            res.send(popular_in_women);
  })
 
  //creating middleware to fetch user
  const fetchUser = async(req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
      return res.status(401).json({message:"No token, authorization denied"});
    }else{
      try{
        const data = jwt.verify(token,'secret_ecom');
        req.user = data.user;
        next();

      }catch(error){
             return res.status(403).json({message:"Token is not valid"});
      }
    }
  }
  //creating endpoint for adding products in cartdata
  app.post('/addtocart',fetchUser,async(req,res)=>{
     let userData = await Users.findOne({_id:req.user.id})
     userData.cartData[req.body.itemId] +=1;
     await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
     res.send("added");
  })

  // Create an endpoint for removing the product in cart
app.post('/removefromcart', fetchUser, async (req, res) => {
  console.log("Remove Cart",req.body.itemId);
  let userData = await Users.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] != 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
})

  // Create an endpoint for getting the cart data (saving the cart items if a user logout )

  app.post('/getcart', fetchUser, async (req, res) => {
    console.log("Get Cart");
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
  
  })

app.listen(port,(error)=>{
    if(!error){
        console.log(`Server is running on port ${port}`);
    }else{
        console.log(`Error in running the server `);
    }
})
//finally completed the mern stack ecomerce website using node ,express,mongodb,reactjs
//thanku great stack youtube for helpping me to develop this great project
