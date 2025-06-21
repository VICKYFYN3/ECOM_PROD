export const getEmailTemplate = (subject, message, preheader = '', imageUrl = '') => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                body {
                    font-family: 'Poppins', 'Arial', sans-serif;
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', 'Arial', sans-serif; background-color: #f4f4f4;">
            <div style="display: none; font-size: 1px; color: #f4f4f4; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
                ${preheader}
            </div>
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.05);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <a href="http://your-store.com" target="_blank">
                        <img src="https://res.cloudinary.com/duvxwhiho/image/upload/v1749069069/logo_vl94iv.png" alt="Forever Logo" style="max-width: 100px; border-radius: 5px; height: auto; background-color: white; padding: 20px;">
                    </a>
                    <h2 style="color: white; margin: 20px 0 0; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">${subject}</h2>
                </div>

                <!-- Newsletter Image (if provided) -->
                ${imageUrl ? `
                <div style="text-align: center; padding: 20px 0;">
                    <img src="${imageUrl}" alt="Newsletter Image" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                </div>
                ` : ''}

                <!-- Content -->
                <div style="padding: 30px 40px; color: #333;">
                    ${message}
                </div>

                <!-- Footer -->
                <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <img src="https://res.cloudinary.com/duvxwhiho/image/upload/v1749069069/logo_vl94iv.png" alt="Forever Logo" style="max-width: 80px; height: auto; margin-bottom: 10px; filter: brightness(0) invert(1);">
                        <p style="color: #95a5a6; margin: 5px 0 0 0; font-size: 12px;">Making fashion accessible forever</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <a href="#" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                            <img src="https://img.icons8.com/color/48/000000/facebook-new.png" width="32" alt="Facebook"/>
                        </a>
                        <a href="#" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                            <img src="https://img.icons8.com/color/48/000000/instagram-new.png" width="32" alt="Instagram"/>
                        </a>
                        <a href="#" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                            <img src="https://img.icons8.com/color/48/000000/twitter.png" width="32" alt="Twitter"/>
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #34495e; margin: 20px 0;">
                    
                    <p style="color: #95a5a6; font-size: 12px; margin: 0; line-height: 1.5;">
                        © ${new Date().getFullYear()} Forever. All rights reserved.<br>
                        123 Fashion Ave, Style City, 45678
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
};

export const getOrderConfirmationEmail = (order) => {
    const { items, address } = order;
    const subject = `Your Order is Confirmed!`;
    const preheader = `Thank you for your purchase. Your order #${order._id.toString().slice(-6)} is being processed.`
    const currency = '₦';

    const message = `
        <div style="font-size: 16px; color: #333; line-height: 1.6;">
            <h3 style="font-size: 22px; font-weight: 600; margin: 0 0 15px;">Hi ${address.firstName},</h3>
            <p style="margin: 0 0 25px;">Thank you for your purchase! We're excited to get your order ready for you. You will receive another email once your order has shipped.</p>
            
            <h4 style="font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; margin-bottom: 20px;">Order Summary ( #${order._id.toString().slice(-6)} )</h4>
            
            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse;">
                ${items.map(item => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px 0;">
                            <div style="display: flex; align-items: center;">
                                <img src="${item.image}" alt="${item.name}" style="width: 65px; height: 65px; object-fit: cover; border-radius: 10px; margin-right: 15px; border: 1px solid #eee;">
                                <div>
                                    <strong style="font-size: 16px; display: block; margin-bottom: 4px;">${item.name}</strong>
                                    <span style="font-size: 14px; color: #666;">Size: ${item.size} &nbsp;|&nbsp; Qty: ${item.quantity}</span>
                                </div>
                            </div>
                        </td>
                        <td style="text-align: right; font-weight: 600;">${currency}${(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>

            <!-- Address Info -->
            <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
                <tr>
                    <td style="background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                         <h4 style="margin: 0 0 15px; font-size: 18px;">Shipping Information</h4>
                         <p style="margin: 0; line-height: 1.6; color: #555;">
                            ${address.firstName} ${address.lastName}<br>
                            ${address.street}<br>
                            ${address.city}, ${address.state} ${address.zipcode}<br>
                            ${address.country}<br>
                            ${address.phone}
                         </p>
                    </td>
                </tr>
            </table>
            
            <p style="margin-top: 30px; color: #777; font-size: 14px;">If you have any questions, please reply to this email. We're happy to help!</p>
        </div>
    `;

    return getEmailTemplate(subject, message, preheader);
};

export const getOrderStatusUpdateEmail = (order) => {
    const { items, address, status } = order;
    const currency = '₦';

    let subject = '';
    let statusMessage = '';

    switch (status) {
        case 'Packing':
            subject = `Your Order is Being Packed`;
            statusMessage = `<p style="margin: 0 0 25px;">Great news! Your order is now being packed by our team. We're carefully preparing your items for shipment.</p>`;
            break;
        case 'Shipped':
            subject = `Your Order has been Shipped`;
            statusMessage = `<p style="margin: 0 0 25px;">Your order has been shipped! It's on its way to you now. You can track your package using the tracking number provided by the courier.</p>`;
            break;
        case 'Out For Delivery':
            subject = `Your Order is Out for Delivery`;
            statusMessage = `<p style="margin: 0 0 25px;">Get ready! Your order is out for delivery and will be with you shortly.</p>`;
            break;
        case 'Delivered':
            subject = `Your Order has been Delivered`;
            statusMessage = `<p style="margin: 0 0 25px;">Your order has been delivered! We hope you enjoy your new items. Thank you for shopping with us!</p>`;
            break;
        default:
            return null; // Don't send email for other statuses
    }

    const preheader = `Your order status has been updated to: ${status}`;

    const message = `
        <div style="font-size: 16px; color: #333; line-height: 1.6;">
            <h3 style="font-size: 22px; font-weight: 600; margin: 0 0 15px;">Hi ${address.firstName},</h3>
            ${statusMessage}
            
            <h4 style="font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; margin-bottom: 20px;">Order Summary ( #${order._id.toString().slice(-6)} )</h4>
            
            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse;">
                ${items.map(item => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 15px 0;">
                            <div style="display: flex; align-items: center;">
                                <img src="${item.image}" alt="${item.name}" style="width: 65px; height: 65px; object-fit: cover; border-radius: 10px; margin-right: 15px; border: 1px solid #eee;">
                                <div>
                                    <strong style="font-size: 16px; display: block; margin-bottom: 4px;">${item.name}</strong>
                                    <span style="font-size: 14px; color: #666;">Size: ${item.size} &nbsp;|&nbsp; Qty: ${item.quantity}</span>
                                </div>
                            </div>
                        </td>
                        <td style="text-align: right; font-weight: 600;">${currency}${(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>

            <!-- Address Info -->
            <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
                <tr>
                    <td style="background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                         <h4 style="margin: 0 0 15px; font-size: 18px;">Shipping Information</h4>
                         <p style="margin: 0; line-height: 1.6; color: #555;">
                            ${address.firstName} ${address.lastName}<br>
                            ${address.street}<br>
                            ${address.city}, ${address.state} ${address.zipcode}<br>
                            ${address.country}<br>
                            ${address.phone}
                         </p>
                    </td>
                </tr>
            </table>
            
            <p style="margin-top: 30px; color: #777; font-size: 14px;">If you have any questions, please reply to this email. We're happy to help!</p>
        </div>
    `;

    return getEmailTemplate(subject, message, preheader);
};