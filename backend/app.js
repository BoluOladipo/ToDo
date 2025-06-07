const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Task = require('./models/Task');

const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret'; // For production, use an environment variable!

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const uri = 'mongodb+srv://boluoladipo246:p4lqSjpqvMhy9A9R@cluster0.ezkgiyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// User registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(409).json({ error: 'Username already taken' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ username, passwordHash });
  await user.save();
  res.status(201).json({ message: 'User registered' });
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Get all tasks for logged-in user
app.get('/todos', authenticateToken, async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });
  res.json(tasks);
});

// Add new task for logged-in user
app.post('/todos', authenticateToken, async (req, res) => {
  const { title, description, reminderDatetime } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newTask = new Task({
    user: req.user.id,
    title,
    description: description || '',
    reminderDatetime: reminderDatetime ? new Date(reminderDatetime) : null,

    
  });

  await newTask.save();
  res.status(201).json(newTask);
});

// Toggle task completion for logged-in user
app.put('/todos/:id', authenticateToken, async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.completed = !task.completed;
  await task.save();
  res.json(task);
});

// Delete a task for logged-in user
app.delete('/todos/:id', authenticateToken, async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  res.json({ message: 'Task deleted' });
});

app.listen(port, () => {
  console.log(`✅ Todo API running at https://todo-backend-pe6h.onrender.com`);
});
