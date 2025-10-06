# 🌐 Traveler Backend API

## Introduction

The Traveler Backend API is a robust and scalable RESTful API built with Node.js, Express.js, and MongoDB. It serves as the data and logic layer for the Traveler application, managing user authentication, accommodation/tour listings, bookings, and providing administrative capabilities with strong role-based access control.

## Features

*   **Centralized Authentication:** User registration, login, and logout functionalities using JWT (JSON Web Tokens) for secure, stateless authentication.
*   **Role-Based Access Control (RBAC):**
    *   Three roles: `user`, `host`, and `admin`.
    *   Middleware (`authMiddleware.protect`, `authMiddleware.restrictTo`) enforces access rules based on user roles for all protected routes.
*   **Listing Management:**
    *   **CRUD Operations:** Full Create, Read, Update, Delete functionality for listings.
    *   **Status Workflow:** New listings default to `pending` status. Only `approved` listings are visible to public users. Admin users have full control over listing statuses.
    *   **Image Handling:** Supports multiple image uploads for listings using `Multer` and `Sharp` for resizing and optimization.
*   **Comprehensive Listing Search & Filter:**
    *   **Advanced Querying:** Filter listings by `location`, `maxGuests`, `tourType`, and `status`.
    *   **Availability Checks:** Integrated logic to filter listings based on `check_in` and `check_out` dates, ensuring only truly available listings are returned.
    *   **Sorting & Pagination:** Efficient handling of large result sets with options to sort by `price`, `ratingsAverage`, `createdAt`, and paginate results.
*   **Booking Management:**
    *   **Booking Creation:** Authenticated users can create bookings for available listings, including validation for dates and guest capacity.
    *   **Availability Enforcement:** Prevents overlapping bookings for the same listing.
    *   **User-Specific Bookings:** Users can retrieve a list of their own bookings.
    *   **Listing Bookings:** An endpoint is provided to fetch all existing bookings for a specific listing, crucial for frontend calendar logic.
*   **User Profile Management:** Authenticated users can fetch their own profile details and update their name, email, and profile photo.
*   **Admin Management:**
    *   **All Listings:** Admin can view, edit, delete, and change the status of *any* listing on the platform.
    *   **User Management:** Admin can fetch, update, and delete any user account.
    *   **All Bookings:** Admin can view and delete *any* booking.
*   **Global Error Handling:** A centralized error handling middleware (`errorHandler.js`) ensures consistent and user-friendly JSON error responses.
*   **Data Validation:** Extensive schema-level and route-level data validation using Mongoose and custom logic.

## Technologies Used

*   **Runtime:** Node.js
*   **Web Framework:** Express.js
*   **Database:** MongoDB
*   **ODM:** Mongoose
*   **Authentication:** JSON Web Tokens (JWT)
*   **Password Hashing:** Bcryptjs
*   **File Uploads:** Multer
*   **Image Processing:** Sharp
*   **Date Utilities:** `date-fns` (for robust date comparisons and calculations)
*   **Environment Variables:** `dotenv`
*   **HTTP Request Logging:** `morgan`
*   **Cross-Origin Resource Sharing:** `cors`
*   **Cookie Parsing:** `cookie-parser`

## Installation

To set up the backend API on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Lokesh7898/Traveler_Backend.git
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Create a `.env` file in the `backend/` directory. This file should contain:
    ```
    NODE_ENV=development
    PORT=Port_Number
    MONGO_URI=MongoDb_Uri
    JWT_SECRET=JWT_Secret_Key
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES_IN=90
    ```
    *   **`NODE_ENV`**: Set to `development` for development, `production` for production.
    *   **`PORT`**: The port on which the server will run.
    *   **`MONGO_URI`**: Your MongoDB connection string. For a local MongoDB instance, it might be `mongodb://localhost:27017/traveler`. For MongoDB Atlas, use your connection string.
    *   **`JWT_SECRET`**: **Crucial for security!** Generate a very long, complex, and random string.
    *   **`JWT_EXPIRES_IN`**: How long JWTs are valid (e.g., `90d` for 90 days).
    *   **`JWT_COOKIE_EXPIRES_IN`**: How long the JWT cookie persists in the browser (in days).
4.  **Run the application:**
    ```bash
    npm run dev   # For development (uses nodemon for auto-restarts)
    # OR
    npm start     # For production
    ```
    The server will start on the specified `PORT`.

## Project Structure

The backend follows a clear MVC-like structure for organization:
backend/
├── config/ # Database connection configuration (db.js)
├── controllers/ # Business logic for handling requests (auth, booking, listing, user controllers)
├── middleware/ # Express middleware (authMiddleware, errorHandler, uploadMiddleware)
├── models/ # Mongoose schemas for MongoDB (Booking, Listing, User models)
├── public/
│ └── uploads/ # Directory for uploaded images
├── routes/ # API route definitions (adminProtectedRoutes, publicRoutes, userProtectedRoutes)
├── utils/ # Utility functions (apiError, apiFeatures, apiResponse, catchAsync)
├── .env.example # Example environment variables file
├── .gitignore # Files to be ignored by Git
├── package.json # Project dependencies and scripts
└── server.js # Main application entry point.

## API Endpoints

All API endpoints are prefixed with `/api/v1`.

### 1. Public Routes (`/api/v1`)

*   **`POST /register`**
    *   **Description:** Registers a new user account.
    *   **Body:** `{ name, email, password, role? ('user' | 'host' | 'admin', defaults to 'user') }`
    *   **Returns:** JWT and user data.
*   **`POST /login`**
    *   **Description:** Authenticates a user and issues a JWT.
    *   **Body:** `{ email, password }`
    *   **Returns:** JWT and user data.
*   **`GET /logout`**
    *   **Description:** Logs out the user by clearing the JWT cookie.
*   **`GET /listings`**
    *   **Description:** Retrieves a list of **approved** listings. Supports powerful filtering, sorting, and pagination.
    *   **Query Parameters:**
        *   `location`: String for location search (case-insensitive regex).
        *   `guests`: Number, filters for listings that can accommodate at least this many guests.
        *   `check_in`: ISO date string (e.g., `2025-10-26`), for availability check.
        *   `check_out`: ISO date string (e.g., `2025-10-28`), for availability check.
        *   `sort`: `price` (low to high), `-price` (high to low), `-ratingsAverage` (high to low), `-createdAt` (newest).
        *   `page`: Page number (defaults to 1).
        *   `limit`: Number of results per page (defaults to 10).
    *   **Returns:** Paginated list of listings.
*   **`GET /listings/:id`**
    *   **Description:** Retrieves details for a single listing by its ID.
*   **`GET /bookings/listing/:listingId`**
    *   **Description:** Retrieves all existing bookings (check-in/check-out dates) for a specific listing ID. Useful for populating calendar availability.
    *   **Returns:** Array of booking objects, each containing `checkInDate` and `checkOutDate`.

### 2. User Protected Routes (`/api/v1`)

*Requires a valid JWT in the `Authorization: Bearer <token>` header or `jwt` cookie.*

*   **`GET /users/me`**
    *   **Description:** Retrieves the profile of the currently authenticated user.
*   **`PATCH /users/updateMe`**
    *   **Description:** Updates the profile of the authenticated user.
    *   **Body:** `multipart/form-data` with fields like `name`, `email`, `photo` (file upload).
*   **`GET /bookings/myBookings`**
    *   **Description:** Retrieves all bookings made by the currently authenticated user.
*   **`POST /bookings`**
    *   **Description:** Creates a new booking for the authenticated user.
    *   **Body:** `{ listingId, checkInDate (ISO string), checkOutDate (ISO string), numGuests, totalPrice }`
    *   **Returns:** The newly created booking object.

### 3. Admin Protected Routes (`/api/v1/admin`)

*Requires a valid JWT in the `Authorization: Bearer <token>` header and the authenticated user to have the `admin` role.*

*   **`GET /listings`**
    *   **Description:** Retrieves all listings on the platform, including `pending` and `rejected` statuses. Supports `page`, `limit` query parameters.
*   **`POST /listings`**
    *   **Description:** Creates a new listing.
    *   **Body:** `multipart/form-data` with fields like `title`, `description`, `location`, `price`, `maxGuests`, `tourType`, and `images` (array of files).
*   **`PATCH /listings/:id`**
    *   **Description:** Updates an existing listing by ID.
    *   **Body:** `multipart/form-data` with fields to update.
*   **`DELETE /listings/:id`**
    *   **Description:** Deletes a listing by ID.
*   **`PATCH /listings/:id/status`**
    *   **Description:** Updates the approval status of a listing.
    *   **Body:** `{ status: 'pending' | 'approved' | 'rejected' }`
*   **`GET /users`**
    *   **Description:** Retrieves a list of all registered users.
*   **`GET /users/:id`**
    *   **Description:** Retrieves a single user by ID.
*   **`PATCH /users/:id`**
    *   **Description:** Updates a user's details by ID.
    *   **Body:** `{ name?, email?, role? }`
*   **`DELETE /users/:id`**
    *   **Description:** Deletes a user account by ID.
*   **`GET /bookings`**
    *   **Description:** Retrieves a list of all bookings across the platform.
*   **`GET /bookings/:id`**
    *   **Description:** Retrieves a single booking by ID.
*   **`DELETE /bookings/:id`**
    *   **Description:** Deletes a booking by ID.

## Middleware

*   **`authMiddleware.js`**: Handles JWT verification (`protect`), role-based access control (`restrictTo`), and checks if a user is logged in (for optional user info on public routes).
*   **`uploadMiddleware.js`**: Configures `multer` for file uploads and `sharp` for image resizing and optimization (for user photos and listing images).
*   **`errorHandler.js`**: Global error handling middleware that catches all `AppError` instances and other unexpected errors, sending consistent JSON error responses.

## Models

*   **`User.js`**: Defines the user schema (name, email, password, role, photo, etc.) with bcrypt for password hashing and JWT methods.
*   **`Listing.js`**: Defines the listing schema (title, description, location, price, images, amenities, maxGuests, tourType, status, host, ratings).
*   **`Booking.js`**: Defines the booking schema (listing, user, checkInDate, checkOutDate, numGuests, totalPrice, paid).

## Error Handling

The API uses a custom `AppError` class and a global `errorHandler` middleware to provide consistent, descriptive JSON error responses (`status`, `message`, `statusCode`) for both operational and programming errors.