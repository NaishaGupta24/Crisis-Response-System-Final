const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'disaster-management-jwt-secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ success: false, message: 'Invalid token' });
    }
};

// Register a new official
router.post('/register', async (req, res) => {
    const { name, email, password, department, mobile_number } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !department || !mobile_number) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    try {
        const db = req.app.locals.db;
        
        // Check if email already exists
        const [existingUser] = await db.execute('SELECT * FROM official_auth WHERE email = ?', [email]);
        
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Insert new official
        const [result] = await db.execute(
            'INSERT INTO official_auth (name, email, password, department, mobile_number) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, department, mobile_number]
        );
        
        if (result.affectedRows === 1) {
            return res.json({ success: true, message: 'Registration successful' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to register' });
        }
    } catch (err) {
        console.error('Error registering official:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Login official
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    try {
        const db = req.app.locals.db;
        
        // Find user by email
        const [rows] = await db.execute('SELECT * FROM official_auth WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
        
        const user = rows[0];
        
        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }
        
        // Create token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'disaster-management-jwt-secret',
            { expiresIn: '24h' }
        );
        
        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                department: user.department
            }
        });
    } catch (err) {
        console.error('Error logging in:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Reset password request
router.post('/reset-password-request', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    try {
        const db = req.app.locals.db;
        
        // Check if email exists
        const [rows] = await db.execute('SELECT * FROM official_auth WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            // Don't reveal that the email doesn't exist for security
            return res.json({ success: true, message: 'If your email exists, a reset link will be sent' });
        }
        
        // Generate reset token
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token valid for 1 hour
        
        // Update user with reset token
        await db.execute(
            'UPDATE official_auth SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [resetToken, tokenExpiry, email]
        );
        
        // In a real app, you would send an email with the reset link
        // For this demo, we'll just return the token
        return res.json({
            success: true,
            message: 'Password reset initiated',
            resetToken // In production, don't return this - send via email
        });
    } catch (err) {
        console.error('Error processing reset request:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    
    try {
        const db = req.app.locals.db;
        
        // Find user with valid reset token
        const [rows] = await db.execute(
            'SELECT * FROM official_auth WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );
        
        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password and clear reset token
        await db.execute(
            'UPDATE official_auth SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
            [hashedPassword, token]
        );
        
        return res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        console.error('Error resetting password:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all tickets (for officials)
router.get('/tickets', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const [rows] = await db.execute('SELECT * FROM tickets_data ORDER BY created_at DESC');
        
        return res.json({ success: true, tickets: rows });
    } catch (err) {
        console.error('Error fetching tickets:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update ticket status
router.put('/ticket/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'assigned', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Valid status is required' });
    }
    
    try {
        const db = req.app.locals.db;
        
        const [result] = await db.execute(
            'UPDATE tickets_data SET status = ? WHERE id = ?',
            [status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        
        return res.json({ success: true, message: 'Ticket status updated successfully' });
    } catch (err) {
        console.error('Error updating ticket:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get ticket statistics
router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        // Get count by help type
        const [helpTypeStats] = await db.execute(`
            SELECT help_type, COUNT(*) as count 
            FROM tickets_data 
            GROUP BY help_type
        `);
        
        // Get count by status
        const [statusStats] = await db.execute(`
            SELECT status, COUNT(*) as count 
            FROM tickets_data 
            GROUP BY status
        `);
        
        // Get count by priority
        const [priorityStats] = await db.execute(`
            SELECT priority, COUNT(*) as count 
            FROM tickets_data 
            GROUP BY priority
        `);
        
        return res.json({
            success: true,
            statistics: {
                byHelpType: helpTypeStats,
                byStatus: statusStats,
                byPriority: priorityStats
            }
        });
    } catch (err) {
        console.error('Error fetching statistics:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get police stations data
router.get('/police-stations', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const [rows] = await db.execute('SELECT * FROM police_stations');
        
        return res.json({ success: true, policeStations: rows });
    } catch (err) {
        console.error('Error fetching police stations:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get fire stations data
router.get('/fire-stations', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        const [rows] = await db.execute('SELECT * FROM fire_stations');
        
        return res.json({ success: true, fireStations: rows });
    } catch (err) {
        console.error('Error fetching fire stations:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update official profile
router.put('/profile', authenticateToken, async (req, res) => {
    const { name, department, mobile_number } = req.body;
    const userId = req.user.id;
    
    if (!name || !department || !mobile_number) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    try {
        const db = req.app.locals.db;
        
        const [result] = await db.execute(
            'UPDATE official_auth SET name = ?, department = ?, mobile_number = ? WHERE id = ?',
            [name, department, mobile_number, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get current official profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const userId = req.user.id;
        
        const [rows] = await db.execute(
            'SELECT id, name, email, department, mobile_number, created_at FROM official_auth WHERE id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.json({ success: true, profile: rows[0] });
    } catch (err) {
        console.error('Error fetching profile:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router; 