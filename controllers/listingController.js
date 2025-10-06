const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { statusCodes, statusMessages, ApiResponse } = require('../utils/apiResponse');
const { isBefore, isAfter, parseISO, areIntervalsOverlapping, isSameDay } = require('date-fns');

exports.uploadListingImages = uploadMiddleware.uploadListingImages;
exports.resizeListingImages = uploadMiddleware.resizeListingImages;

exports.createListing = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'host') {
        return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
    }
    req.body.host = req.user.id;
    const newListing = await Listing.create(req.body);
    new ApiResponse(res).success(statusCodes.CREATED, { listing: newListing }, statusMessages.CREATED);
});

exports.getAllListings = catchAsync(async (req, res, next) => {
    if (req.query.status === 'all' || req.query.status === 'pending' || req.query.status === 'rejected') {
        if (!req.user || req.user.role !== 'admin') {
            req.query.status = 'approved';
        }
    } else if (!req.query.status) {
        req.query.status = 'approved';
    }

    let excludedListingIds = [];
    const { check_in, check_out } = req.query;

    if (check_in && check_out) {
        const parsedCheckIn = parseISO(check_in);
        const parsedCheckOut = parseISO(check_out);

        if (isBefore(parsedCheckOut, parsedCheckIn) || isSameDay(parsedCheckOut, parsedCheckIn)) {
            return next(new AppError(statusMessages.INVALID_BOOKING_DATES, statusCodes.BAD_REQUEST));
        }

        const conflictingBookings = await Booking.find({
            $or: [
                { checkInDate: { $lt: parsedCheckOut }, checkOutDate: { $gt: parsedCheckIn } }
            ]
        });

        excludedListingIds = conflictingBookings.map(booking => booking.listing.toString());
    }

    const features = new APIFeatures(Listing.find(), req.query);

    if (excludedListingIds.length > 0) {
        features.query = features.query.where('_id').nin(excludedListingIds);
    }

    if (req.query.status && req.query.status !== 'all') {
        features.query = features.query.where('status').equals(req.query.status);
    }

    features.filter().sort().limitFields().paginate();

    const listings = await features.query.populate({
        path: 'host',
        select: 'name email photo'
    });

    const countFeatures = new APIFeatures(Listing.find(), req.query);
    if (excludedListingIds.length > 0) {
        countFeatures.query = countFeatures.query.where('_id').nin(excludedListingIds);
    }
    if (req.query.status && req.query.status !== 'all') {
        countFeatures.query = countFeatures.query.where('status').equals(req.query.status);
    }
    countFeatures.filter();
    const totalListings = await countFeatures.query.countDocuments();

    new ApiResponse(res).success(
        statusCodes.OK,
        { listings },
        statusMessages.SUCCESS,
        null,
        listings.length,
        {
            currentPage: parseInt(req.query.page, 10) || 1,
            limit: parseInt(req.query.limit, 10) || 10,
            totalPages: Math.ceil(totalListings / (parseInt(req.query.limit, 10) || 10)),
            totalResults: totalListings,
        }
    );
});

exports.getListing = catchAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id).populate({
        path: 'host',
        select: 'name email photo'
    });
    if (!listing) {
        return next(new AppError(statusMessages.NO_LISTING_FOUND, statusCodes.NOT_FOUND));
    }
    if (listing.status !== 'approved' && (!req.user || (req.user.role !== 'admin' && listing.host._id.toString() !== req.user.id))) {
        return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
    }
    new ApiResponse(res).success(statusCodes.OK, { listing }, statusMessages.SUCCESS);
});

exports.updateListing = catchAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        return next(new AppError(statusMessages.NO_LISTING_FOUND, statusCodes.NOT_FOUND));
    }
    if (req.user.role !== 'admin' && listing.host.toString() !== req.user.id) {
        return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
    }
    if (req.body.availability) {
        delete req.body.availability;
    }
    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    new ApiResponse(res).success(statusCodes.OK, { listing: updatedListing }, statusMessages.SUCCESS);
});

exports.deleteListing = catchAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        return next(new AppError(statusMessages.NO_LISTING_FOUND, statusCodes.NOT_FOUND));
    }
    if (req.user.role !== 'admin' && listing.host.toString() !== req.user.id) {
        return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
    }
    await Listing.findByIdAndDelete(req.params.id);
    new ApiResponse(res).success(statusCodes.NO_CONTENT, null, statusMessages.NO_CONTENT);
});

exports.updateListingStatus = catchAsync(async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
    }
    const { status } = req.body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return next(new AppError(statusMessages.INVALID_LISTING_STATUS, statusCodes.BAD_REQUEST));
    }
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!listing) {
        return next(new AppError(statusMessages.NO_LISTING_FOUND, statusCodes.NOT_FOUND));
    }
    new ApiResponse(res).success(statusCodes.OK, { listing }, statusMessages.SUCCESS);
});