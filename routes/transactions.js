const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('transactions', { title: 'Transactions' });
});

module.exports = router;

