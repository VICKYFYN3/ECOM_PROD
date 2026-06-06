import Contact from '../models/contactModel.js';
import User from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import logger from '../utils/logger.js';
import eventLogger from '../utils/eventLogger.js';
import svc from '../utils/serviceLogger.js';
import { sendEmail } from '../queues/emailQueue.js';
import { RC, getUserMessage } from '../utils/responseCodes.js';

const createContactMessage = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { subject, message, priority } = req.body;
        const userId = req.body.userId;
        if (!userId) return res.status(401).json({ success: false, message: getUserMessage(RC.AUTH_05.code), requestId });
        const user = await svc.db(traceId, 'findById', 'users', () => User.findById(userId));
        if (!user) return res.status(404).json({ success: false, message: getUserMessage(RC.USR_03.code), requestId });
        const contactMessage = await svc.db(traceId, 'save', 'contacts', async () => {
            const c = new Contact({ name: user.name, email: user.email, subject, message, priority, userId });
            await c.save();
            return c;
        });
        res.status(201).json({ success: true, message: 'Contact message sent successfully', data: contactMessage });
    } catch (error) {
        logger.error('Create contact message failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.status(500).json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const getAllContactMessages = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { status, priority, page = 1, limit = 10 } = req.query;
        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        const skip = (page - 1) * limit;
        const messages = await svc.db(traceId, 'find', 'contacts', () =>
            Contact.find(query).populate('userId', 'name email').populate('respondedBy', 'name')
                .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        );
        const total = await svc.db(traceId, 'countDocuments', 'contacts', () => Contact.countDocuments(query));
        res.json({ success: true, data: messages, pagination: {
            currentPage: parseInt(page), totalPages: Math.ceil(total / limit),
            totalMessages: total, hasNext: page * limit < total, hasPrev: page > 1
        }});
    } catch (error) {
        logger.error('Get all contact messages failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.status(500).json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const getContactMessageById = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { id } = req.params;
        const message = await svc.db(traceId, 'findById', 'contacts', () =>
            Contact.findById(id).populate('userId', 'name email').populate('respondedBy', 'name')
        );
        if (!message) return res.status(404).json({ success: false, message: 'Contact message not found', requestId });
        res.json({ success: true, data: message });
    } catch (error) {
        logger.error('Get contact message by ID failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.status(500).json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const updateContactStatus = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;
        const adminId = req.body.userId;
        const message = await svc.db(traceId, 'findById', 'contacts', () => Contact.findById(id));
        if (!message) return res.status(404).json({ success: false, message: 'Contact message not found', requestId });
        const updateData = { status };
        if (adminResponse) {
            updateData.adminResponse = adminResponse;
            updateData.respondedBy = adminId;
            updateData.respondedAt = new Date();
            await sendEmail(message.email, `Response to your inquiry: ${message.subject}`, `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <h2>Response to Your Inquiry</h2>
                    <p>Hello ${message.name},</p>
                    <p>We have responded to your inquiry regarding: <strong>${message.subject}</strong></p>
                    <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
                        <h3 style="color:#007bff;">Our Response:</h3>
                        <p>${adminResponse}</p>
                    </div>
                    <p>Thank you for contacting us.<br>Best regards,<br>The Support Team</p>
                </div>
            `, 'contact_response').catch(err =>
                eventLogger.system.emailError({ traceId, error: err.message, type: 'contact_response' })
            );
        }
        const updatedMessage = await svc.db(traceId, 'findByIdAndUpdate', 'contacts', () =>
            Contact.findByIdAndUpdate(id, updateData, { new: true })
                .populate('userId', 'name email').populate('respondedBy', 'name')
        );
        res.json({ success: true, message: 'Contact message updated successfully', data: updatedMessage });
    } catch (error) {
        logger.error('Update contact status failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.status(500).json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const getContactStats = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const stats = await svc.db(traceId, 'aggregate', 'contacts', () =>
            Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
        );
        const priorityStats = await svc.db(traceId, 'aggregate', 'contacts', () =>
            Contact.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }])
        );
        const totalMessages = await svc.db(traceId, 'countDocuments', 'contacts', () => Contact.countDocuments());
        const newMessages = await svc.db(traceId, 'countDocuments', 'contacts', () => Contact.countDocuments({ status: 'new' }));
        res.json({ success: true, data: { totalMessages, newMessages, statusBreakdown: stats, priorityBreakdown: priorityStats } });
    } catch (error) {
        logger.error('Get contact stats failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.status(500).json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const getUserContactMessages = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const userId = req.body.userId;
        if (!userId) return res.status(401).json({ success: false, message: getUserMessage(RC.AUTH_05.code), requestId });
        const messages = await svc.db(traceId, 'find', 'contacts', () => Contact.find({ userId }).sort({ createdAt: -1 }));
        res.json({ success: true, data: messages });
    } catch (error) {
        logger.error('Get user contact messages failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.status(500).json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

export { createContactMessage, getAllContactMessages, getContactMessageById, updateContactStatus, getContactStats, getUserContactMessages };
