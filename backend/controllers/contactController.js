import Contact from '../models/contactModel.js';
import User from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import logger from '../utils/logger.js';
import eventLogger from '../utils/eventLogger.js';

const sendEmail = async (to, subject, html) => {
    return transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
};

const createContactMessage = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { subject, message, priority } = req.body;
        const userId = req.body.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const contactMessage = new Contact({ name: user.name, email: user.email, subject, message, priority, userId });
        await contactMessage.save();
        logger.info('Contact message created', { requestId, userId, subject, priority, messageId: contactMessage._id });
        res.status(201).json({ success: true, message: 'Contact message sent successfully', data: contactMessage });
    } catch (error) {
        logger.error('Create contact message failed', { requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to send contact message' });
    }
};

const getAllContactMessages = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { status, priority, page = 1, limit = 10 } = req.query;
        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        const skip = (page - 1) * limit;
        const messages = await Contact.find(query)
            .populate('userId', 'name email').populate('respondedBy', 'name')
            .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
        const total = await Contact.countDocuments(query);
        logger.info('Admin fetched contact messages', { requestId, total, page, filters: { status, priority } });
        res.json({ success: true, data: messages, pagination: {
            currentPage: parseInt(page), totalPages: Math.ceil(total / limit),
            totalMessages: total, hasNext: page * limit < total, hasPrev: page > 1
        }});
    } catch (error) {
        logger.error('Get all contact messages failed', { requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to fetch contact messages' });
    }
};

const getContactMessageById = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { id } = req.params;
        const message = await Contact.findById(id).populate('userId', 'name email').populate('respondedBy', 'name');
        if (!message) return res.status(404).json({ success: false, message: 'Contact message not found' });
        res.json({ success: true, data: message });
    } catch (error) {
        logger.error('Get contact message by ID failed', { requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to fetch contact message' });
    }
};

const updateContactStatus = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;
        const adminId = req.body.userId;
        const message = await Contact.findById(id);
        if (!message) return res.status(404).json({ success: false, message: 'Contact message not found' });
        const updateData = { status };
        if (adminResponse) {
            updateData.adminResponse = adminResponse;
            updateData.respondedBy = adminId;
            updateData.respondedAt = new Date();
            try {
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
                `);
                logger.info('Contact response email sent', { requestId, messageId: id, to: message.email });
            } catch (emailError) {
                eventLogger.system.emailError({ requestId, error: emailError.message, type: 'contact_response' });
            }
        }
        const updatedMessage = await Contact.findByIdAndUpdate(id, updateData, { new: true })
            .populate('userId', 'name email').populate('respondedBy', 'name');
        logger.info('Contact message status updated', { requestId, messageId: id, status, hasResponse: !!adminResponse, updatedBy: adminId });
        res.json({ success: true, message: 'Contact message updated successfully', data: updatedMessage });
    } catch (error) {
        logger.error('Update contact status failed', { requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to update contact message' });
    }
};

const getContactStats = async (req, res) => {
    const requestId = req.requestId;
    try {
        const stats = await Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const priorityStats = await Contact.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);
        const totalMessages = await Contact.countDocuments();
        const newMessages = await Contact.countDocuments({ status: 'new' });
        res.json({ success: true, data: { totalMessages, newMessages, statusBreakdown: stats, priorityBreakdown: priorityStats } });
    } catch (error) {
        logger.error('Get contact stats failed', { requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to fetch contact statistics' });
    }
};

const getUserContactMessages = async (req, res) => {
    const requestId = req.requestId;
    try {
        const userId = req.body.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const messages = await Contact.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: messages });
    } catch (error) {
        logger.error('Get user contact messages failed', { requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to fetch contact messages' });
    }
};

export { createContactMessage, getAllContactMessages, getContactMessageById, updateContactStatus, getContactStats, getUserContactMessages };
