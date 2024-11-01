const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('validators', { title: 'Validators' });
});

module.exports = router;
