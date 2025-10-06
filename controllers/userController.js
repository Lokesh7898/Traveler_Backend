const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { statusCodes, statusMessages, ApiResponse } = require('../utils/apiResponse');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.uploadUserPhoto = uploadMiddleware.uploadUserPhoto;
exports.resizeUserPhoto = uploadMiddleware.resizeUserPhoto;

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError(statusMessages.NO_USER_FOUND, statusCodes.NOT_FOUND));
    }
    new ApiResponse(res).success(statusCodes.OK, { user }, statusMessages.SUCCESS);
});

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password) {
        return next(new AppError(statusMessages.PASSWORD_UPDATE_NOT_ALLOWED, statusCodes.BAD_REQUEST));
    }
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.body.photo) filteredBody.photo = req.body.photo;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
    new ApiResponse(res).success(statusCodes.OK, { user: updatedUser }, statusMessages.SUCCESS);
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    new ApiResponse(res).success(statusCodes.OK, { users }, statusMessages.SUCCESS, null, users.length);
});

exports.updateUser = catchAsync(async (req, res, next) => {
    if (req.body.password) {
        return next(new AppError(statusMessages.PASSWORD_UPDATE_NOT_ALLOWED, statusCodes.BAD_REQUEST));
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedUser) {
        return next(new AppError(statusMessages.NO_USER_FOUND, statusCodes.NOT_FOUND));
    }
    new ApiResponse(res).success(statusCodes.OK, { user: updatedUser }, statusMessages.SUCCESS);
});

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        return next(new AppError(statusMessages.NO_USER_FOUND, statusCodes.NOT_FOUND));
    }
    new ApiResponse(res).success(statusCodes.NO_CONTENT, null, statusMessages.NO_CONTENT);
});