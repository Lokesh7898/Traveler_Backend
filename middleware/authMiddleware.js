const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { statusCodes, statusMessages } = require('../utils/apiResponse');

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError(statusMessages.TOKEN_MISSING, statusCodes.UNAUTHORIZED));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
        return next(new AppError(statusMessages.TOKEN_INVALID, statusCodes.UNAUTHORIZED));
    }
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError(statusMessages.PASSWORD_CHANGED_AFTER_TOKEN, statusCodes.UNAUTHORIZED));
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(statusMessages.NO_PERMISSION, statusCodes.FORBIDDEN));
        }
        next();
    };
};

exports.isLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            req.user = currentUser;
            res.locals.user = currentUser;
            return next();
        }
    } catch (err) {
        return next();
    }
    next();
};