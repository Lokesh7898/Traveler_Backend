const statusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const statusMessages = {
  SUCCESS: 'Success',
  CREATED: 'Resource created successfully',
  NO_CONTENT: 'Resource deleted successfully',
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  VALIDATION_ERROR: 'Validation Error',
  EMAIL_ALREADY_REGISTERED: 'Email already registered',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_MISSING: 'No token, authorization denied',
  TOKEN_INVALID: 'Token is not valid',
  TOKEN_EXPIRED: 'Your token has expired! Please log in again.',
  PASSWORD_CHANGED_AFTER_TOKEN: 'User recently changed password! Please log in again.',
  FILE_TYPE_UNSUPPORTED: 'Unsupported file type. Only JPG, JPEG, PNG are allowed.',
  FILE_UPLOAD_FAILED: 'File upload failed',
  NO_PERMISSION: 'You do not have permission to perform this action',
  LISTING_NOT_FOUND_OR_UNAVAILABLE: 'Listing not found or not available for booking.',
  INVALID_BOOKING_DATES: 'Invalid booking dates. Check-out must be after check-in, and dates cannot be in the past.',
  GUESTS_EXCEED_MAX: (maxGuests) => `Number of guests exceeds maximum allowed for this listing (${maxGuests}).`,
  LISTING_UNAVAILABLE: 'The listing is not available for the requested dates.',
  BOOKING_CREATED_SUCCESS: 'Booking created successfully!',
  NO_USER_FOUND: 'No user found with that ID',
  PASSWORD_UPDATE_NOT_ALLOWED: 'This route is not for password updates. Please use /updateMyPassword.',
  NO_LISTING_FOUND: 'No listing found with that ID',
  INVALID_LISTING_STATUS: 'Invalid status provided. Must be pending, approved, or rejected.',
  ROUTE_NOT_FOUND: (url) => `Can't find ${url} on this server!`,
};

class ApiResponse {
  constructor(res) {
    this.res = res;
  }

  success(statusCode = statusCodes.OK, data = null, message = statusMessages.SUCCESS, token = null, results = null, pagination = null) {
    const response = { status: 'success', message };
    if (token) response.token = token;
    if (data) response.data = data;
    if (results !== null) response.results = results;
    if (pagination) response.pagination = pagination;
    this.res.status(statusCode).json(response);
  }
}

module.exports = { statusCodes, statusMessages, ApiResponse };