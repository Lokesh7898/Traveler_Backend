const express = require('express');
const authController = require('../controllers/authController');
const listingController = require('../controllers/listingController');
const authMiddleware = require('../middleware/authMiddleware');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/listings', authMiddleware.isLoggedIn, listingController.getAllListings);
router.get('/listings/:id', authMiddleware.isLoggedIn, listingController.getListing);
router.get('/bookings/listing/:listingId', bookingController.getBookingsForListing);

module.exports = router;