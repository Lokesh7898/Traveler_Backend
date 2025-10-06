const express = require('express');
const userController = require('../controllers/userController');
const listingController = require('../controllers/listingController');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

const createListingMiddleware = [
    listingController.uploadListingImages,
    listingController.resizeListingImages,
    listingController.createListing
];

const updateListingMiddleware = [
    listingController.uploadListingImages,
    listingController.resizeListingImages,
    listingController.updateListing
];

router.get('/listings', listingController.getAllListings);
router.post('/listings', createListingMiddleware);
router.patch('/listings/:id', updateListingMiddleware);
router.delete('/listings/:id', listingController.deleteListing);
router.patch('/listings/:id/status', listingController.updateListingStatus);
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUser);
router.patch('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.get('/bookings', bookingController.getAllBookings);
router.get('/bookings/:id', bookingController.getBooking);
router.delete('/bookings/:id', bookingController.deleteBooking);

module.exports = router;