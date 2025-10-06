const express = require('express');
const userController = require('../controllers/userController');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

const updateUserProfileMiddleware = [
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
];

router.get('/users/me', userController.getMe, userController.getUser);
router.patch('/users/updateMe', updateUserProfileMiddleware);
router.get('/bookings/myBookings', bookingController.getMyBookings);
router.post('/bookings', bookingController.createBooking);

module.exports = router;