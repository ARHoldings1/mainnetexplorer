const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('tokens', { title: 'Tokens' });
});

module.exports = router;
