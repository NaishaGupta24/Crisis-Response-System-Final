const express = require('express');
const router = express.Router();

// Create a new ticket
router.post('/tickets', async (req, res) => {
    const { name, contact_number, location, latitude, longitude, help_type, description } = req.body;
    
    // Validate required fields
    if (!name || !contact_number || !location || !help_type || !description) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    try {
        const db = req.app.locals.db;
        
        // Set priority based on help_type
        let priority = 'medium';
        if (help_type === 'severely_injured') {
            priority = 'high';
        } else if (help_type === 'evacuation' || help_type === 'special') {
            priority = 'medium';
        } else {
            priority = 'low';
        }
        
        // Insert new ticket into database
        const [result] = await db.execute(
            'INSERT INTO tickets_data (name, contact_number, location, latitude, longitude, help_type, description, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, contact_number, location, latitude, longitude, help_type, description, priority]
        );
        
        if (result.affectedRows === 1) {
            return res.json({ 
                success: true, 
                message: 'Ticket created successfully', 
                ticketId: result.insertId 
            });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to create ticket' });
        }
    } catch (err) {
        console.error('Error creating ticket:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all tickets for a specific contact number
router.get('/tickets/:contactNumber', async (req, res) => {
    const { contactNumber } = req.params;
    
    try {
        const db = req.app.locals.db;
        
        const [rows] = await db.execute(
            'SELECT * FROM tickets_data WHERE contact_number = ? ORDER BY created_at DESC',
            [contactNumber]
        );
        
        return res.json({ success: true, tickets: rows });
    } catch (err) {
        console.error('Error fetching tickets:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get a specific ticket by ID
router.get('/ticket/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const db = req.app.locals.db;
        
        const [rows] = await db.execute(
            'SELECT * FROM tickets_data WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        
        return res.json({ success: true, ticket: rows[0] });
    } catch (err) {
        console.error('Error fetching ticket:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// SOS emergency request
router.post('/sos', async (req, res) => {
    const { name, contact_number, latitude, longitude } = req.body;
    
    if (!latitude || !longitude || !contact_number) {
        return res.status(400).json({ success: false, message: 'Location and contact number are required' });
    }
    
    try {
        const db = req.app.locals.db;
        const location = `Lat: ${latitude}, Lng: ${longitude}`;
        
        // Insert SOS request with highest priority
        const [result] = await db.execute(
            'INSERT INTO tickets_data (name, contact_number, location, latitude, longitude, help_type, description, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name || 'SOS Emergency', contact_number, location, latitude, longitude, 'severely_injured', 'SOS Emergency Request', 'high', 'pending']
        );
        
        if (result.affectedRows === 1) {
            return res.json({ 
                success: true, 
                message: 'SOS alert sent successfully', 
                ticketId: result.insertId 
            });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to send SOS alert' });
        }
    } catch (err) {
        console.error('Error creating SOS alert:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router; 