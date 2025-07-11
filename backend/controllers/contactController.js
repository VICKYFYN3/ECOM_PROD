import Contact from '../models/contactModel.js';
import User from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

// Helper function to send emails
const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html
    };

    return transporter.sendMail(mailOptions);
};

// Create a new contact message
const createContactMessage = async (req, res) => {
    try {
        const { subject, message, priority } = req.body;
        const userId = req.body.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const contactMessage = new Contact({
            name: user.name,
            email: user.email,
            subject,
            message,
            priority,
            userId
        });

        await contactMessage.save();

        // Send admin notification email using the same template as user
        try {
            const { getEmailTemplate } = await import('../utils/emailTemplates.js');
            const adminSubject = `New Contact Message: ${subject}`;
            const adminMessage = `
                <div style="font-size: 16px; color: #333; line-height: 1.6;">
                    <h3 style="font-size: 22px; font-weight: 600; margin: 0 0 15px;">New Contact Message Received</h3>
                    <p><strong>From:</strong> ${user.name} (${user.email})</p>
                    <p><strong>Priority:</strong> ${priority || 'Normal'}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <strong>Message:</strong>
                        <p style="margin: 10px 0 0 0;">${message}</p>
                    </div>
                </div>
            `;
            const adminHtml = getEmailTemplate(adminSubject, adminMessage);
            await sendEmail(process.env.NOTIFY_EMAIL, adminSubject, adminHtml);
        } catch (adminEmailError) {
            console.error('Failed to send admin notification email:', adminEmailError);
        }

        res.status(201).json({
            success: true,
            message: 'Contact message sent successfully',
            data: contactMessage
        });
    } catch (error) {
        console.error('Error creating contact message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send contact message'
        });
    }
};

// Get all contact messages (admin only)
const getAllContactMessages = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 10 } = req.query;
        
        let query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (priority) {
            query.priority = priority;
        }

        const skip = (page - 1) * limit;
        
        const messages = await Contact.find(query)
            .populate('userId', 'name email')
            .populate('respondedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(query);

        res.json({
            success: true,
            data: messages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalMessages: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact messages'
        });
    }
};

// Get contact message by ID
const getContactMessageById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const message = await Contact.findById(id)
            .populate('userId', 'name email')
            .populate('respondedBy', 'name');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        res.json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Error fetching contact message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact message'
        });
    }
};

// Update contact message status (admin only)
const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminResponse } = req.body;
        const adminId = req.body.userId;

        const message = await Contact.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }

        const updateData = { status };
        
        if (adminResponse) {
            updateData.adminResponse = adminResponse;
            updateData.respondedBy = adminId;
            updateData.respondedAt = new Date();

            // Send email notification to customer
            try {
                const emailSubject = `Response to your inquiry: ${message.subject}`;
                const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Response to Your Inquiry</h2>
                        <p>Hello ${message.name},</p>
                        <p>We have responded to your inquiry regarding: <strong>${message.subject}</strong></p>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #007bff; margin-top: 0;">Our Response:</h3>
                            <p style="margin-bottom: 0;">${adminResponse}</p>
                        </div>
                        
                        <p>You can view the full conversation in your account dashboard.</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; font-size: 14px;">
                                Thank you for contacting us.<br>
                                Best regards,<br>
                                The Support Team
                            </p>
                        </div>
                    </div>
                `;

                await sendEmail(message.email, emailSubject, emailBody);
                console.log('Email notification sent to customer:', message.email);
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
                // Don't fail the whole request if email fails
            }
        }

        const updatedMessage = await Contact.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('userId', 'name email')
         .populate('respondedBy', 'name');

        res.json({
            success: true,
            message: 'Contact message updated successfully',
            data: updatedMessage
        });
    } catch (error) {
        console.error('Error updating contact message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contact message'
        });
    }
};

// Get contact statistics (admin only)
const getContactStats = async (req, res) => {
    try {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const priorityStats = await Contact.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalMessages = await Contact.countDocuments();
        const newMessages = await Contact.countDocuments({ status: 'new' });

        res.json({
            success: true,
            data: {
                totalMessages,
                newMessages,
                statusBreakdown: stats,
                priorityBreakdown: priorityStats
            }
        });
    } catch (error) {
        console.error('Error fetching contact stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact statistics'
        });
    }
};

// Get contact messages for a specific user
const getUserContactMessages = async (req, res) => {
    try {
        const userId = req.body.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const messages = await Contact.find({ userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching user contact messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact messages'
        });
    }
};

export {
    createContactMessage,
    getAllContactMessages,
    getContactMessageById,
    updateContactStatus,
    getContactStats,
    getUserContactMessages
}; 