const db = require('../config/db');

// Get citizen's tickets with filtering and pagination
exports.getTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const { status, priority, type, search } = req.query;
        const userId = req.user.id;

        let query = `
            SELECT t.*, 
                   u.name as reporter_name,
                   o.name as assigned_official_name
            FROM tickets t
            LEFT JOIN users u ON t.reporter_id = u.id
            LEFT JOIN officials o ON t.assigned_to = o.id
            WHERE t.reporter_id = ?
        `;
        const queryParams = [userId];

        // Add filters
        if (status) {
            query += ' AND t.status = ?';
            queryParams.push(status);
        }
        if (priority) {
            query += ' AND t.priority = ?';
            queryParams.push(priority);
        }
        if (type) {
            query += ' AND t.type = ?';
            queryParams.push(type);
        }
        if (search) {
            query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Get total count for pagination
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM (${query}) as count_query`,
            queryParams
        );
        const totalTickets = countResult[0].total;
        const totalPages = Math.ceil(totalTickets / limit);

        // Add pagination
        query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Execute final query
        const [tickets] = await db.query(query, queryParams);

        res.json({
            tickets,
            totalPages,
            currentPage: page,
            totalTickets
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
};

// Get ticket details
exports.getTicketDetails = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const userId = req.user.id;

        // Get ticket details
        const [ticket] = await db.query(
            `SELECT t.*, 
                    u.name as reporter_name,
                    u.email as reporter_email,
                    u.phone as reporter_phone,
                    o.name as assigned_official_name,
                    o.email as assigned_official_email,
                    o.phone as assigned_official_phone
            FROM tickets t
            LEFT JOIN users u ON t.reporter_id = u.id
            LEFT JOIN officials o ON t.assigned_to = o.id
            WHERE t.id = ? AND t.reporter_id = ?`,
            [ticketId, userId]
        );

        if (!ticket[0]) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get ticket updates
        const [updates] = await db.query(
            `SELECT tu.*, 
                    CASE 
                        WHEN tu.user_id IS NOT NULL THEN u.name
                        WHEN tu.official_id IS NOT NULL THEN o.name
                        ELSE 'System'
                    END as updated_by
            FROM ticket_updates tu
            LEFT JOIN users u ON tu.user_id = u.id
            LEFT JOIN officials o ON tu.official_id = o.id
            WHERE tu.ticket_id = ?
            ORDER BY tu.created_at DESC`,
            [ticketId]
        );

        res.json({
            ...ticket[0],
            updates
        });
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).json({ error: 'Failed to fetch ticket details' });
    }
};

// Create new ticket
exports.createTicket = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            type, 
            priority, 
            location,
            contact_number,
            latitude,
            longitude
        } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!title || !description || !type || !priority || !location || !contact_number) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields' 
            });
        }

        // Validate priority
        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority.toLowerCase())) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid priority level' 
            });
        }

        // Validate type
        const validTypes = ['severely_injured', 'mildly_injured', 'evacuation', 'ration', 'special'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid ticket type' 
            });
        }

        const [result] = await db.query(
            `INSERT INTO tickets (
                title, 
                description, 
                type, 
                priority, 
                location,
                contact_number,
                latitude,
                longitude,
                reporter_id, 
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                title, 
                description, 
                type, 
                priority.toLowerCase(), 
                location,
                contact_number,
                latitude || null,
                longitude || null,
                userId
            ]
        );

        // Add initial ticket update
        await db.query(
            `INSERT INTO ticket_updates (ticket_id, user_id, update_type, description)
            VALUES (?, ?, 'created', 'Ticket created')`,
            [result.insertId, userId]
        );

        res.status(201).json({
            success: true,
            ticketId: result.insertId,
            message: 'Ticket created successfully'
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create ticket',
            error: error.message 
        });
    }
};

// Update ticket status
exports.updateTicketStatus = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;
        const userId = req.user.id;

        // Check if ticket exists and belongs to user
        const [ticket] = await db.query(
            'SELECT * FROM tickets WHERE id = ? AND reporter_id = ?',
            [ticketId, userId]
        );

        if (!ticket[0]) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Update ticket status
        await db.query(
            'UPDATE tickets SET status = ? WHERE id = ?',
            [status, ticketId]
        );

        // Add status update to ticket updates
        await db.query(
            `INSERT INTO ticket_updates (ticket_id, user_id, update_type, description)
            VALUES (?, ?, 'status', ?)`,
            [ticketId, userId, `Status updated to ${status}`]
        );

        res.json({ message: 'Ticket status updated successfully' });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ error: 'Failed to update ticket status' });
    }
};

// Add ticket update/comment
exports.addTicketUpdate = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const { description } = req.body;
        const userId = req.user.id;

        // Check if ticket exists and belongs to user
        const [ticket] = await db.query(
            'SELECT * FROM tickets WHERE id = ? AND reporter_id = ?',
            [ticketId, userId]
        );

        if (!ticket[0]) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Add update to ticket updates
        await db.query(
            `INSERT INTO ticket_updates (ticket_id, user_id, update_type, description)
            VALUES (?, ?, 'comment', ?)`,
            [ticketId, userId, description]
        );

        res.json({ message: 'Ticket update added successfully' });
    } catch (error) {
        console.error('Error adding ticket update:', error);
        res.status(500).json({ error: 'Failed to add ticket update' });
    }
}; 