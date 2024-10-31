const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');

dotenv.config();

const app = express();

// MongoDB connection with timeout and better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  socketTimeoutMS: 45000, // 45 second timeout
  connectTimeoutMS: 10000, // 10 second timeout
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Don't crash the server on connection error
  // Instead, we'll handle errors in the routes
});

// Keep alive signal for MongoDB
setInterval(() => {
  if (mongoose.connection.readyState === 1) {
    mongoose.connection.db.admin().ping();
  }
}, 30000);

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

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific types of errors
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(503).render('error', { 
      title: 'Database Error', 
      error: 'Database connection issue. Please try again in a few moments.' 
    });
  }
  
  if (err.code === 'ETIMEDOUT') {
    return res.status(504).render('error', { 
      title: 'Timeout Error', 
      error: 'Request timed out. Please try again.' 
    });
  }

  // Default error response
  res.status(500).render('error', { 
    title: 'Error', 
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
  });
});

// Add a keep-alive endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
