require("dotenv").config();

const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cors = require('cors'); 
const app = express();

app.use(cors());
app.use(express.json());
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true }
}));
const Workout = mongoose.model('Workout',new mongoose.Schema({
  workoutName:{type: String,required: true},
  sets:[{reps:{type: Number,required: true}}]},
 {versionKey: false, timestamps: true }));


app.get('/workouts', async (_, res)=>{
  try{
    const workouts=await Workout.find({});
    res.json(workouts);
  } catch (err){
    res.status(500).json({message:'Server error'});
  }
});
app.post('/workouts',async(req, res)=>{
  try{
    const {workoutName,sets}=req.body;
    if (!workoutName||!sets||sets.length===0)
      return res.status(400).json({message:'Workout name and sets are required'});
    const workout=new Workout({workoutName, sets});
    await workout.save();
    res.status(201).json({message:'Workout added successfully'});
  } catch (err){
    res.status(500).json({message:'Server error'});
  }
});


app.get('/', (req, res) => {
  res.send('Backend is running successfully 🚀');
});
app.post('/signup', async (req, res) => {
  try {
    const {email, username, phoneNumber, password, confirmPassword}=req.body;
    if (!email||!username||!phoneNumber||!password||!confirmPassword){
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword){
      return res.status(400).json({message:'Passwords do not match'});
    }
    const existingUser=await User.findOne({email});
    if (existingUser) {
      return res.status(409).json({ message:'Email already registered'});
    }
    const hashedPassword=await bcrypt.hash(password, 10);
    await new User({email,username,phoneNumber,password: hashedPassword}).save();
    res.status(201).json({message:'Signup successful'});
  } catch (err) {
    console.error(err);
    res.status(500).json({message:'Server error'});
  }
});

  
app.get('/users',async(_, res)=>{
  try{
    const users=await User.find({},{password:0,__v:0});
    res.json(users);
  }catch(err){
    res.status(500).json({message:'Server error'});
  }
});




app.post('/login', async (req, res) => {
  try {
    const {email,password}=req.body;
    console.log("Login email:", email);
    console.log("Entered password:", password);

    
    if (!email||!password)
      return res.status(400).json({message:'All fields are required'});
    const user=await User.findOne({email});
    if (!user)
      return res.status(401).json({message:'Invalid email or password'});
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({message:'Invalid email or password'});
    res.status(200).json({
      message: 'Login successful',
      username: user.username,
      email: user.email
    });
  } catch (err){
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(3000,()=>console.log('Server running on port 3000'));
