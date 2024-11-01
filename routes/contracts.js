const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');

router.post('/verify', contractController.verifyContract);
router.get('/:address', contractController.getContractDetails);
router.get('/search', contractController.searchContracts);

module.exports = router;
