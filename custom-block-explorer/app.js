const express = require('express');
const { Web3 } = require('web3');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
const port = process.env.PORT || 3001;
const web3 = new Web3('http://54.92.173.128:8545');
const chainId = 1546;
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Make sure to create this model

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB Atlas connection string
const mongoURI = 'mongodb+srv://webmaster:pktiyoPqzyPItJee@mainnetuserdata.j6dyq.mongodb.net/dotprotocol_explorer?retryWrites=true&w=majority&appName=mainnetuserdata';

// MongoDB connection
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Session middleware
app.use(session({
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: mongoURI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add this middleware before your routes
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  next();
});

// Home route
app.get('/', async (req, res) => {
    try {
        const latestBlock = await web3.eth.getBlock('latest');
        const latestBlocks = await Promise.all(
            Array.from({length: 10}, (_, i) => web3.eth.getBlock(Number(latestBlock.number) - i))
        );

        const latestTransactions = await Promise.all(
            latestBlock.transactions.slice(0, 5).map(async txHash => {
                const tx = await web3.eth.getTransaction(txHash);
                return {
                    ...tx,
                    value: tx.value.toString(),
                    timestamp: latestBlock.timestamp.toString()
                };
            })
        );

        const totalTransactions = latestBlocks.reduce((acc, block) => acc + Number(block.transactions.length), 0);
        const averageBlockTime = ((Number(latestBlocks[0].timestamp) - Number(latestBlocks[4].timestamp)) / 4).toFixed(2);

        const timeSpan = Number(latestBlocks[0].timestamp) - Number(latestBlocks[4].timestamp);
        const tps = (Number(totalTransactions) / timeSpan).toFixed(2);

        const gasPrice = await web3.eth.getGasPrice();
        const gasPriceGwei = parseFloat(web3.utils.fromWei(gasPrice, 'gwei')).toFixed(2);
        const gasLimit = 30000000; // Set the correct gas limit

        res.render('index', { 
            title: 'Chennai Testnet - The Official Testnet of the Dot Protocol',
            latestBlock,
            latestBlocks,
            latestTransactions,
            totalTransactions,
            averageBlockTime,
            tps,
            web3,
            getTimeDifference,
            calculateTxnFee,
            gasPrice: gasPriceGwei,
            gasLimit: gasLimit
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'An error occurred while fetching data.' });
    }
});

// Coming Soon route
app.get('/coming-soon', (req, res) => {
    res.render('coming-soon', { title: 'Coming Soon - Chennai Testnet' });
});

// Update the existing route to use the new '/coming-soon' route
app.get(['/blockchain', '/validators', '/tokens', '/nfts', '/resources', '/developers', '/delegate', '/brand-assets', '/contact', '/bug-bounty', '/api-docs', '/knowledge-base', '/network-status', '/learn-dpc20', '/advertise', '/explorer-as-a-service', '/api-plans', '/priority-support'], (req, res) => {
    res.redirect('/coming-soon');
});

// Terms route
app.get('/terms', (req, res) => {
    res.render('terms', { title: 'Terms of Service - Chennai Testnet' });
});

// Privacy route
app.get('/privacy', (req, res) => {
    res.render('privacy', { title: 'Privacy Policy - Chennai Testnet' });
});

// Login route
app.get('/login', (req, res) => {
    res.render('login', { title: 'Sign In - Chennai Testnet' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            req.session.username = user.username;
            res.redirect('/profile');
        } else {
            res.render('login', { title: 'Sign In - Chennai Testnet', error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('error', { message: 'An error occurred during login.' });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

// Profile route
app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    // Fetch user data and render profile page
    res.render('profile', { title: 'My Profile - Chennai Testnet', username: req.session.username });
});

// Blocks route
app.get('/blocks', async (req, res) => {
    try {
        const latestBlock = await web3.eth.getBlock('latest');
        const blocks = await Promise.all(
            Array.from({length: 25}, (_, i) => web3.eth.getBlock(Number(latestBlock.number) - i))
        );

        res.render('blocks', { 
            title: 'All Blocks - Chennai Testnet',
            blocks,
            web3,
            getTimeDifference
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'An error occurred while fetching block data.' });
    }
});

// Transactions route
app.get('/transactions', async (req, res) => {
    try {
        const latestBlock = await web3.eth.getBlock('latest');
        const transactions = await Promise.all(
            latestBlock.transactions.slice(0, 25).map(async txHash => {
                const tx = await web3.eth.getTransaction(txHash);
                return {
                    ...tx,
                    value: tx.value.toString(),
                    timestamp: latestBlock.timestamp.toString()
                };
            })
        );

        res.render('transactions', { 
            title: 'All Transactions - Chennai Testnet',
            transactions,
            web3,
            getTimeDifference,
            calculateTxnFee
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'An error occurred while fetching transaction data.' });
    }
});

// Helper functions
function getTimeDifference(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - Number(timestamp);
    if (diff < 60) return `${diff} secs ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

function calculateTxnFee(tx) {
    const gasPrice = web3.utils.fromWei(tx.gasPrice.toString(), 'ether');
    return (gasPrice * tx.gas).toFixed(8);
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
