const express = require('express');
const router = express.Router();
const { Web3 } = require('web3');
const BigNumber = require('bignumber.js');

// Initialize Web3 with your Dot Protocol RPC URL
const web3 = new Web3('http://54.92.173.128:8545');

router.get('/', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.render('search', { title: 'Search', results: null, error: 'Please enter a search query.', web3 });
  }

  try {
    let results = null;

    if (web3.utils.isAddress(query)) {
      console.log('Searching for address:', query);
      try {
        const balance = await web3.eth.getBalance(query);
        console.log('Balance fetched:', balance);
        const code = await web3.eth.getCode(query);
        console.log('Code fetched:', code);
        const balanceBN = new BigNumber(balance);
        const balanceInEther = web3.utils.fromWei(balance, 'ether');
        
        results = { 
          type: 'address', 
          data: { 
            address: query, 
            balance: balanceInEther,
            balanceWei: balance,
            isContract: code !== '0x'
          } 
        };
      } catch (addressError) {
        console.error('Error fetching address details:', addressError);
        throw new Error('Failed to fetch address details');
      }
    } else if (query.length === 66 && query.startsWith('0x')) {
      console.log('Searching for transaction or block:', query);
      try {
        const tx = await web3.eth.getTransaction(query);
        if (tx) {
          results = { type: 'transaction', data: tx };
        } else {
          const block = await web3.eth.getBlock(query);
          if (block) {
            results = { type: 'block', data: block };
          }
        }
      } catch (txBlockError) {
        console.error('Error fetching transaction or block:', txBlockError);
        throw new Error('Failed to fetch transaction or block details');
      }
    } else if (!isNaN(query)) {
      console.log('Searching for block by number:', query);
      try {
        const block = await web3.eth.getBlock(parseInt(query));
        if (block) {
          results = { type: 'block', data: block };
        }
      } catch (blockError) {
        console.error('Error fetching block by number:', blockError);
        throw new Error('Failed to fetch block details');
      }
    } else {
      console.log('Unrecognized query type');
      results = { type: 'unknown', data: { message: 'Unrecognized search query' } };
    }

    console.log('Search results:', results);
    res.render('search', { title: 'Search Results', results, error: null, web3 });
  } catch (error) {
    console.error('Search error:', error);
    res.render('search', { title: 'Search Error', results: null, error: error.message || 'An error occurred while searching.', web3 });
  }
});

module.exports = router;
