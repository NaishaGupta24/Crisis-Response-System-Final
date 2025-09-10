require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2/promise');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'disaster-management-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'disaster_management'
};

// Create a MySQL pool for connection reuse
const pool = mysql.createPool(dbConfig);

// Make the pool available to routes
app.locals.db = pool;

// Import routes
const citizenRoutes = require('./routes/citizen');
const officialRoutes = require('./routes/official');

// Use routes
app.use('/api/citizen', citizenRoutes);
app.use('/api/official', officialRoutes);

// Fetch police stations
app.get('/api/police_stations', (req, res) => {
    pool.getConnection().then(connection => {
        connection.query('SELECT * FROM police_stations', (error, results) => {
            connection.release();
            if (error) {
                return res.status(500).json({ error: 'Database query failed' });
            }
            res.json(results);
        });
    }).catch(error => {
        console.error('Error connecting to the database:', error);
        res.status(500).json({ error: 'Database connection failed' });
    });
});

// Root route - serve the index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; 