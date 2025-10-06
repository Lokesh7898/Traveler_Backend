const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.ObjectId,
        ref: 'Listing',
        required: [true, 'Booking must belong to a Listing!']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a User!']
    },
    checkInDate: {
        type: Date,
        required: [true, 'Booking must have a check-in date!']
    },
    checkOutDate: {
        type: Date,
        required: [true, 'Booking must have a check-out date!']
    },
    numGuests: {
        type: Number,
        required: [true, 'Booking must specify number of guests!'],
        min: [1, 'Number of guests must be at least 1']
    },
    totalPrice: {
        type: Number,
        required: [true, 'Booking must have a total price!']
    },
    paid: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

bookingSchema.index({ user: 1 });
bookingSchema.index({ listing: 1 });

bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate('listing');
    next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;