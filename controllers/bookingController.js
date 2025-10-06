const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { statusCodes, statusMessages, ApiResponse } = require('../utils/apiResponse');
const { isBefore, isAfter, areIntervalsOverlapping, isSameDay, startOfDay } = require('date-fns');

exports.createBooking = catchAsync(async (req, res, next) => {
    const { listingId, checkInDate, checkOutDate, numGuests, totalPrice } = req.body;
    const userId = req.user.id;

    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'approved') {
        return next(new AppError(statusMessages.LISTING_NOT_FOUND_OR_UNAVAILABLE, statusCodes.NOT_FOUND));
    }

    const parsedCheckIn = startOfDay(new Date(checkInDate));
    const parsedCheckOut = startOfDay(new Date(checkOutDate));
    const today = startOfDay(new Date());

    if (isBefore(parsedCheckOut, parsedCheckIn) || isSameDay(parsedCheckOut, parsedCheckIn)) {
        return next(new AppError(statusMessages.INVALID_BOOKING_DATES, statusCodes.BAD_REQUEST));
    }
    if (isBefore(parsedCheckIn, today)) {
        return next(new AppError(statusMessages.INVALID_BOOKING_DATES, statusCodes.BAD_REQUEST));
    }


    if (numGuests > listing.maxGuests) {
        return next(new AppError(statusMessages.GUESTS_EXCEED_MAX(listing.maxGuests), statusCodes.BAD_REQUEST));
    }

    const conflictingBookings = await Booking.find({
        listing: listingId,
        $or: [
            { checkInDate: { $lt: parsedCheckOut }, checkOutDate: { $gt: parsedCheckIn } }
        ]
    });

    if (conflictingBookings.length > 0) {
        const newInterval = { start: parsedCheckIn, end: parsedCheckOut };
        const hasOverlap = conflictingBookings.some(booking =>
            areIntervalsOverlapping(
                newInterval,
                { start: booking.checkInDate, end: booking.checkOutDate }
            )
        );

        if (hasOverlap) {
            return next(new AppError(statusMessages.LISTING_UNAVAILABLE, statusCodes.BAD_REQUEST));
        }
    }

    const newBooking = await Booking.create({
        listing: listingId,
        user: userId,
        checkInDate: parsedCheckIn,
        checkOutDate: parsedCheckOut,
        numGuests,
        totalPrice,
        paid: true
    });

    new ApiResponse(res).success(
        statusCodes.CREATED,
        { booking: newBooking },
        statusMessages.BOOKING_CREATED_SUCCESS
    );
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find();
    new ApiResponse(res).success(statusCodes.OK, { bookings }, statusMessages.SUCCESS, null, bookings.length);
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });
    new ApiResponse(res).success(statusCodes.OK, { bookings }, statusMessages.SUCCESS, null, bookings.length);
});

exports.getBookingsForListing = catchAsync(async (req, res, next) => {
    const { listingId } = req.params;
    console.log(`[BACKEND] getBookingsForListing: Received request for listingId: ${listingId}`);
    const bookings = await Booking.find({ listing: listingId });
    console.log(`[BACKEND] getBookingsForListing: Found ${bookings.length} bookings for listingId ${listingId}.`);
    console.log(`[BACKEND] getBookingsForListing: Bookings data:`, bookings);
    new ApiResponse(res).success(statusCodes.OK, { bookings }, statusMessages.SUCCESS, null, bookings.length);
});

exports.getBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        return next(new AppError(statusMessages.NOT_FOUND, statusCodes.NOT_FOUND));
    }
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) {
        return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
    }
    new ApiResponse(res).success(statusCodes.OK, { booking }, statusMessages.SUCCESS);
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        return next(new AppError(statusMessages.NOT_FOUND, statusCodes.NOT_FOUND));
    }
    if (req.user.role !== 'admin') {
        return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
    }
    await Booking.findByIdAndDelete(req.params.id);
    new ApiResponse(res).success(statusCodes.NO_CONTENT, null, statusMessages.NO_CONTENT);
});