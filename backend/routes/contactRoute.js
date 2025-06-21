import express from 'express';
import { createContactMessage, getAllContactMessages, getContactMessageById, updateContactStatus, getContactStats, getUserContactMessages } from '../controllers/contactController.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// User routes (require authentication)
router.post('/create', auth, createContactMessage);
router.get('/user-messages', auth, getUserContactMessages);

// Admin routes (require admin authentication)
router.get('/all', adminAuth, getAllContactMessages);
router.get('/stats', adminAuth, getContactStats);
router.get('/:id', adminAuth, getContactMessageById);
router.put('/:id/status', adminAuth, updateContactStatus);

export default router; 