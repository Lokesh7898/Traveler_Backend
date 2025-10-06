const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { statusCodes, statusMessages, ApiResponse } = require('../utils/apiResponse');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    };

    user.password = undefined;

    new ApiResponse(res).success(statusCode, { user }, statusMessages.SUCCESS, token);
};

exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password, role } = req.body;
    let userRole = 'user';
    if (role && ['host', 'admin'].includes(role)) {
        userRole = role;
    }
    const newUser = await User.create({ name, email, password, role: userRole });
    createSendToken(newUser, statusCodes.CREATED, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError(statusMessages.BAD_REQUEST, statusCodes.BAD_REQUEST));
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError(statusMessages.INVALID_CREDENTIALS, statusCodes.UNAUTHORIZED));
    }
    createSendToken(user, statusCodes.OK, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    new ApiResponse(res).success(statusCodes.OK, null, statusMessages.SUCCESS);
};