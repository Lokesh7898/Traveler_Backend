const { isAfter, isBefore, parseISO, isSameDay } = require('date-fns');

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'location', 'guests', 'status', 'check_in', 'check_out'];
        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        if (Object.keys(JSON.parse(queryStr)).length > 0) {
            this.query = this.query.find(JSON.parse(queryStr));
        }
        return this;
    }

    customFilters() {
        const { location, guests, status } = this.queryString;

        if (status && status !== 'all') {
            this.query = this.query.where('status').equals(status);
        } else if (!status && !this.queryString.check_in) {
            this.query = this.query.where('status').equals('approved');
        }

        if (location) {
            this.query = this.query.find({ location: { $regex: location, $options: 'i' } });
        }

        if (guests) {
            const numGuests = parseInt(guests, 10);
            if (!isNaN(numGuests) && numGuests > 0) {
                this.query = this.query.find({ maxGuests: { $gte: numGuests } });
            }
        }

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            let sortBy = this.queryString.sort;
            if (sortBy === 'price_asc') {
                sortBy = 'price';
            } else if (sortBy === 'price_desc') {
                sortBy = '-price';
            }
            sortBy = sortBy.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;