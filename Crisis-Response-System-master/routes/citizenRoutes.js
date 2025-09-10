const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');
const auth = require('../middleware/auth');

// Get citizen's tickets with filtering and pagination
router.get('/tickets', auth, citizenController.getTickets);

// Get ticket details
router.get('/tickets/:id', auth, citizenController.getTicketDetails);

// Create new ticket
router.post('/tickets', auth, citizenController.createTicket);

// Update ticket status
router.patch('/tickets/:id/status', auth, citizenController.updateTicketStatus);

// Add ticket update/comment
router.post('/tickets/:id/updates', auth, citizenController.addTicketUpdate);

module.exports = router; 