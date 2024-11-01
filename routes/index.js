const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

router.get('/', indexController.getHomePage);
router.get('/blocks', indexController.getAllBlocks);
router.get('/block/:blockNumber', indexController.getBlockDetails);
router.get('/address/:address', indexController.getAddressDetails);
router.get('/search', indexController.search);

// New routes for footer links
router.get('/delegate', (req, res) => res.render('coming-soon', { title: 'Delegate to Dot Protocol Scan' }));
router.get('/brand-assets', (req, res) => res.render('coming-soon', { title: 'Brand Assets' }));
router.get('/contact', (req, res) => res.render('coming-soon', { title: 'Contact Us' }));
router.get('/bug-bounty', (req, res) => res.render('coming-soon', { title: 'Bug Bounty' }));
router.get('/api-docs', (req, res) => res.render('coming-soon', { title: 'API Documentation' }));
router.get('/knowledge-base', (req, res) => res.render('coming-soon', { title: 'Knowledge Base' }));
router.get('/network-status', (req, res) => res.render('coming-soon', { title: 'Network Status' }));
router.get('/learn-dpc20', (req, res) => res.render('coming-soon', { title: 'Learn DPC20' }));
router.get('/advertise', (req, res) => res.render('coming-soon', { title: 'Advertise' }));
router.get('/eaas', (req, res) => res.render('coming-soon', { title: 'Explorer as a Service (EaaS)' }));
router.get('/api-plans', (req, res) => res.render('coming-soon', { title: 'API Plans' }));
router.get('/priority-support', (req, res) => res.render('coming-soon', { title: 'Priority Support' }));

// We'll create separate routes for Terms and Privacy
router.get('/terms', indexController.getTerms);
router.get('/privacy', indexController.getPrivacy);
router.get('/terms-and-privacy', indexController.getTermsAndPrivacy);

module.exports = router;
