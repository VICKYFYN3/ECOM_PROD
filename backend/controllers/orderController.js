import orderModel from "../models/orderModel.js"
import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js'; // Add this import
import Stripe from 'stripe';
import Paystack from "paystack";
import { getOrderConfirmationEmail, getOrderStatusUpdateEmail } from "../utils/emailTemplates.js";
import transporter from "../config/nodemailer.js";

//global variables
const currency = 'ngn'
const deliveryCharge = 10

//gateway interface
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

// Helper function to update stock for ordered items
const updateProductStock = async (items) => {
    try {
        for (const item of items) {
            const product = await productModel.findById(item._id);
            if (!product) {
                console.warn(`Product not found: ${item._id}`);
                continue;
            }

            // Get current stock for the specific size
            const currentSizeStock = product.sizeStock instanceof Map 
                ? (product.sizeStock.get(item.size) || 0)
                : (product.sizeStock?.[item.size] || 0);

            // Calculate new stock (prevent negative stock)
            const newSizeStock = Math.max(0, currentSizeStock - item.quantity);

            // Update the specific size stock
            const update = {
                $set: {
                    [`sizeStock.${item.size}`]: newSizeStock
                }
            };

            await productModel.findByIdAndUpdate(item._id, update);

            // Recalculate total stock from all sizes
            const updatedProduct = await productModel.findById(item._id);
            let totalStock = 0;
            
            if (updatedProduct.sizeStock instanceof Map) {
                for (const [_, stock] of updatedProduct.sizeStock) {
                    totalStock += stock || 0;
                }
            } else if (updatedProduct.sizeStock) {
                Object.values(updatedProduct.sizeStock).forEach(stock => {
                    totalStock += stock || 0;
                });
            }

            // Update total stock quantity
            await productModel.findByIdAndUpdate(item._id, { stockQuantity: totalStock });

            console.log(`Stock updated for product ${item.name} (${item.size}): ${currentSizeStock} -> ${newSizeStock}, Total: ${totalStock}`);
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        throw error;
    }
};

// Helper function to restore stock (for failed orders)
const restoreProductStock = async (items) => {
    try {
        for (const item of items) {
            const product = await productModel.findById(item._id);
            if (!product) {
                console.warn(`Product not found: ${item._id}`);
                continue;
            }

            // Get current stock for the specific size
            const currentSizeStock = product.sizeStock instanceof Map 
                ? (product.sizeStock.get(item.size) || 0)
                : (product.sizeStock?.[item.size] || 0);

            // Restore stock
            const restoredSizeStock = currentSizeStock + item.quantity;

            // Update the specific size stock
            const update = {
                $set: {
                    [`sizeStock.${item.size}`]: restoredSizeStock
                }
            };

            await productModel.findByIdAndUpdate(item._id, update);

            // Recalculate total stock from all sizes
            const updatedProduct = await productModel.findById(item._id);
            let totalStock = 0;
            
            if (updatedProduct.sizeStock instanceof Map) {
                for (const [_, stock] of updatedProduct.sizeStock) {
                    totalStock += stock || 0;
                }
            } else if (updatedProduct.sizeStock) {
                Object.values(updatedProduct.sizeStock).forEach(stock => {
                    totalStock += stock || 0;
                });
            }

            // Update total stock quantity
            await productModel.findByIdAndUpdate(item._id, { stockQuantity: totalStock });

            console.log(`Stock restored for product ${item.name} (${item.size}): ${currentSizeStock} -> ${restoredSizeStock}, Total: ${totalStock}`);
        }
    } catch (error) {
        console.error('Error restoring stock:', error);
        throw error;
    }
};

// Validate stock availability before placing order
const validateStockAvailability = async (items) => {
    for (const item of items) {
        const product = await productModel.findById(item._id);
        if (!product) {
            throw new Error(`Product not found: ${item.name}`);
        }

        const currentSizeStock = product.sizeStock instanceof Map 
            ? (product.sizeStock.get(item.size) || 0)
            : (product.sizeStock?.[item.size] || 0);

        if (currentSizeStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name} (Size: ${item.size}). Available: ${currentSizeStock}, Requested: ${item.quantity}`);
        }
    }
};

// Placing orders using COD
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        // Validate stock availability first
        await validateStockAvailability(items);

        // Update stock before placing order
        await updateProductStock(items);

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "COD",
            payment: false
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Send order confirmation email
        const emailHtml = getOrderConfirmationEmail(newOrder);
        const subject = `Your Order is Confirmed!`;
        await transporter.sendMail({
            from: `"Forever" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: subject,
            html: emailHtml
        });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// placing orders using Stripe method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        // Validate stock availability first
        await validateStockAvailability(items);

        // Update stock before creating order
        await updateProductStock(items);

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "Stripe",
            payment: false
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//verify Stripe
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body;

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            const order = await orderModel.findById(orderId);
            // Send order confirmation email
            const emailHtml = getOrderConfirmationEmail(order);
            const subject = `Your Order is Confirmed!`;
            await transporter.sendMail({
                from: `"Forever" <${process.env.EMAIL_USER}>`,
                to: order.address.email,
                subject: subject,
                html: emailHtml
            });
            await userModel.findByIdAndUpdate(userId, { cartData: {} });
            res.json({ success: true });
        } else {
            // If payment failed, restore stock and delete order
            const order = await orderModel.findById(orderId);
            if (order && order.items) {
                await restoreProductStock(order.items);
            }
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// placing orders using Paystack
const placeOrderPaystack = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;

        // Validate stock availability first
        await validateStockAvailability(items);

        // Update stock before creating order
        await updateProductStock(items);

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: "Paystack",
            payment: false
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Create Paystack transaction
        const transaction = await paystack.transaction.initialize({
            amount: (amount + deliveryCharge) * 100, // Convert to kobo/cent
            email: address.email,
            reference: `order_${newOrder._id}_${Date.now()}`,
            callback_url: `${origin}/verify-paystack?orderId=${newOrder._id}`,
            currency: currency.toUpperCase(),
            metadata: {
                orderId: newOrder._id.toString(),
                userId
            }
        });

        res.json({
            success: true,
            authorization_url: transaction.data.authorization_url
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//verify Paystack
const verifyPaystack = async (req, res) => {
    const { orderId, reference } = req.body;

    try {
        const response = await paystack.transaction.verify(reference);
        
        if (response.status) {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            const order = await orderModel.findById(orderId);
            // Send order confirmation email
            const emailHtml = getOrderConfirmationEmail(order);
            const subject = `Your Order is Confirmed!`;
            await transporter.sendMail({
                from: `"Forever" <${process.env.EMAIL_USER}>`,
                to: order.address.email,
                subject: subject,
                html: emailHtml
            });
            await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
            res.json({ success: true });
        } else {
            // If payment failed, restore stock and delete order
            const order = await orderModel.findById(orderId);
            if (order && order.items) {
                await restoreProductStock(order.items);
            }
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//All orders data for Admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//user order for frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body;

        const orders = await orderModel.find({ userId });
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

//update order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { status });

        // Send status update email
        const order = await orderModel.findById(orderId);
        if (order) {
            const emailHtml = getOrderStatusUpdateEmail(order);
            if (emailHtml) {
                const mailOptions = {
                    from: `"Forever" <${process.env.EMAIL_USER}>`,
                    to: order.address.email,
                    subject: `Your Order Status: ${status}`,
                    html: emailHtml
                };
                
                // This is a workaround, the subject should be part of the emailHtml
                if (emailHtml.includes("<title>")) {
                    mailOptions.subject = emailHtml.split('<title>')[1].split('</title>')[0];
                }

                await transporter.sendMail(mailOptions);
            }
        }

        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        res.json({ success: false, message: "Error" });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId, payment } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { payment });
        res.json({ success: true, message: "Payment status updated successfully" });
    } catch (error) {
        res.json({ success: false, message: "Error updating payment status" });
    }
}

export { 
    verifyStripe, 
    placeOrder, 
    placeOrderStripe, 
    placeOrderPaystack, 
    allOrders, 
    userOrders, 
    updateStatus, 
    verifyPaystack,
    updatePaymentStatus
};