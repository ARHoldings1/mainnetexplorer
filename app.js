const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

dotenv.config();

const app = express();

// Replace the initial mongoose.connect with this utility function
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000, // Reduced timeout for serverless
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      maxPoolSize: 1, // Reduced pool size for serverless
      minPoolSize: 0,
      maxIdleTimeMS: 5000,
      waitQueueTimeoutMS: 3000,
    });
    
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Replace the middleware with this
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Request connection error:', error);
    next(error);
  }
});

// Add this near the top of your middleware stack
app.use((req, res, next) => {
  // Set timeout to 10 seconds
  req.setTimeout(10000, () => {
    const err = new Error('Request Timeout');
    err.status = 408;
    next(err);
  });
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
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // Only update sessions once per day
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native',
    stringify: false
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
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
