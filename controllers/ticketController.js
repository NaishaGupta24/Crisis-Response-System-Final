// Get ticket details by ID
exports.getTicketDetails = async (req, res) => {
    try {
        const ticketId = req.params.id;
        const query = `
            SELECT t.*, 
                   u.name as reporter_name,
                   u.email as reporter_email,
                   u.phone as reporter_phone,
                   o.name as assigned_official_name,
                   o.email as assigned_official_email,
                   o.phone as assigned_official_phone
            FROM tickets t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN officials o ON t.assigned_to = o.id
            WHERE t.id = ?
        `;
        
        const [ticket] = await db.query(query, [ticketId]);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get ticket updates
        const updatesQuery = `
            SELECT tu.*, 
                   CASE 
                       WHEN tu.updated_by_type = 'user' THEN u.name
                       WHEN tu.updated_by_type = 'official' THEN o.name
                       ELSE 'System'
                   END as updated_by_name
            FROM ticket_updates tu
            LEFT JOIN users u ON tu.updated_by = u.id AND tu.updated_by_type = 'user'
            LEFT JOIN officials o ON tu.updated_by = o.id AND tu.updated_by_type = 'official'
            WHERE tu.ticket_id = ?
            ORDER BY tu.created_at DESC
        `;
        
        const [updates] = await db.query(updatesQuery, [ticketId]);
        
        res.json({
            ticket,
            updates
        });
    } catch (error) {
        console.error('Error fetching ticket details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 