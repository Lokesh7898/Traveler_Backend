const AppError = require('../utils/appError');
const { statusCodes, statusMessages } = require('../utils/apiResponse');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, statusCodes.BAD_REQUEST);
};

const handleDuplicateFieldsDB = err => {
    const value = err.keyValue ? (err.keyValue.email || JSON.stringify(err.keyValue)) : 'unknown';
    const message = `Duplicate field value: '${value}'. Please use another value!`;
    return new AppError(message, statusCodes.CONFLICT);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, statusCodes.VALIDATION_ERROR);
};

const handleJWTError = () => new AppError(statusMessages.TOKEN_INVALID, statusCodes.UNAUTHORIZED);
const handleJWTExpiredError = () => new AppError(statusMessages.TOKEN_EXPIRED, statusCodes.UNAUTHORIZED);

const sendErrorDev = (err, req, res) => {
    console.error('ERROR 💥', err);
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, req, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.error('ERROR 💥', err);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: statusMessages.INTERNAL_SERVER_ERROR,
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};