const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorHandler');
const { statusCodes, statusMessages } = require('./utils/apiResponse');
const publicRoutes = require('./routes/publicRoutes');
const userProtectedRoutes = require('./routes/userProtectedRoutes');
const adminProtectedRoutes = require('./routes/adminProtectedRoutes');

dotenv.config();
connectDB();
const app = express();

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/public/uploads', express.static(uploadsDir));

app.use('/api/v1', publicRoutes);
app.use('/api/v1', userProtectedRoutes);
app.use('/api/v1/admin', adminProtectedRoutes);

app.all('*', (req, res, next) => {
    next(new AppError(statusMessages.ROUTE_NOT_FOUND(req.originalUrl), statusCodes.NOT_FOUND));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err.message);
    process.exit(1);
});