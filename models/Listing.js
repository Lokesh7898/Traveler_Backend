const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A listing must have a title'],
        trim: true,
        maxlength: [100, 'A listing title must have less or equal than 100 characters'],
        minlength: [10, 'A listing title must have more or equal than 10 characters'],
    },
    description: {
        type: String,
        required: [true, 'A listing must have a description'],
        trim: true,
    },
    location: {
        type: String,
        required: [true, 'A listing must have a location'],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'A listing must have a price'],
        min: [0, 'Price must be a positive number']
    },
    images: {
        type: [String],
        default: []
    },
    amenities: {
        type: [String],
        default: []
    },
    maxGuests: {
        type: Number,
        required: [true, 'A listing must specify maximum number of guests'],
        min: [1, 'Maximum guests must be at least 1']
    },
    tourType: {
        type: String,
        enum: ['adventure', 'cultural', 'beach', 'city', 'nature', 'luxury', 'other'],
        default: 'other',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    host: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Listing must belong to a user'],
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

listingSchema.index({ price: 1, ratingsAverage: -1 });
listingSchema.index({ location: 1 });

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;