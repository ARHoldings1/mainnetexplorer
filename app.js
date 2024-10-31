const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

dotenv.config();

const app = express();

// Updated MongoDB connection without deprecated options
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 15000,
  connectTimeoutMS: 10000,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 10000,
  waitQueueTimeoutMS: 5000,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Remove the keep-alive ping as it's not effective in serverless
// Instead, implement connection handling per request
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
      console.error('Request connection error:', error);
    }
  }
  next();
});

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Middleware to make user data available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
const indexRoutes = require('./routes/index');
const validatorRoutes = require('./routes/validators');
const transactionRoutes = require('./routes/transactions');
const tokenRoutes = require('./routes/tokens');
const authRoutes = require('./routes/auth');

app.use('/', indexRoutes);
app.use('/validators', validatorRoutes);
app.use('/transactions', transactionRoutes);
app.use('/tokens', tokenRoutes);
app.use('/auth', authRoutes);

// Enhanced error handling middleware with more specific cases
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    console.error('Database Error Details:', err);
    return res.status(503).render('error', { 
      title: 'Database Error', 
      error: 'Database connection issue. Please try again in a few moments.' 
    });
  }
  
  if (err.code === 'ETIMEDOUT' || err.name === 'TimeoutError') {
    console.error('Timeout Error Details:', err);
    return res.status(504).render('error', { 
      title: 'Timeout Error', 
      error: 'Request timed out. Please try again.' 
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).render('error', { 
      title: 'Validation Error', 
      error: 'Invalid data provided.' 
    });
  }

  console.error('Unhandled Error:', err);
  res.status(500).render('error', { 
    title: 'Error', 
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
  });
});

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ 
      status: 'ok',
      mongodb: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error',
      mongodb: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
