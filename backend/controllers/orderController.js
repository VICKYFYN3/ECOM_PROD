import orderModel from "../models/orderModel.js"
import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js';
import Stripe from 'stripe';
import Paystack from "paystack";
import { getOrderConfirmationEmail, getOrderStatusUpdateEmail, getAdminOrderNotificationEmail, getStockAlertEmail } from "../utils/emailTemplates.js";
import transporter from "../config/nodemailer.js";
import eventLogger from "../utils/eventLogger.js";
import logger from "../utils/logger.js";
import { KEYS, TTL, cacheDel, CHANNELS } from "../utils/cache.js";
import { publish } from "../utils/pubsub.js";
import orderQueue from "../queues/orderQueue.js";
import { sendEmail } from "../queues/emailQueue.js";
import svc from "../utils/serviceLogger.js";

const currency = 'ngn'
const deliveryCharge = 10
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

const updateProductStock = async (items, traceId = null) => {
    try {
        for (const item of items) {
            const product = await svc.db(traceId, 'findById', 'products', () =>
                productModel.findById(item._id)
            );
            if (!product) {
                logger.warn('Product not found during stock update', { traceId, productId: item._id });
                continue;
            }
            const currentSizeStock = product.sizeStock instanceof Map
                ? (product.sizeStock.get(item.size) || 0)
                : (product.sizeStock?.[item.size] || 0);
            const newSizeStock = Math.max(0, currentSizeStock - item.quantity);

            await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
                productModel.findByIdAndUpdate(item._id, { $set: { [`sizeStock.${item.size}`]: newSizeStock } })
            );

            const updatedProduct = await svc.db(traceId, 'findById', 'products', () =>
                productModel.findById(item._id)
            );
            let totalStock = 0;
            if (updatedProduct.sizeStock instanceof Map) {
                for (const [_, stock] of updatedProduct.sizeStock) totalStock += stock || 0;
            } else if (updatedProduct.sizeStock) {
                Object.values(updatedProduct.sizeStock).forEach(stock => { totalStock += stock || 0; });
            }

            await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
                productModel.findByIdAndUpdate(item._id, { stockQuantity: totalStock })
            );

            await cacheDel(KEYS.product(item._id));
            await cacheDel(KEYS.productList());
            await publish(CHANNELS.STOCK_UPDATED, {
                productId: item._id, productName: product.name,
                size: item.size, previousStock: currentSizeStock,
                newStock: newSizeStock, totalStock,
            });

            eventLogger.product.stockUpdated({
                traceId, productId: item._id, productName: product.name,
                size: item.size, previousStock: currentSizeStock,
                newStock: newSizeStock, totalStock,
            });

            if (newSizeStock === 0) {
                eventLogger.product.lowStock({ requestId, traceId, productId: item._id, productName: product.name, size: item.size, stock: 0, alert: 'out_of_stock' });
                if (process.env.NOTIFY_EMAIL) {
                    await sendEmail(process.env.NOTIFY_EMAIL, 'Out of Stock Alert', getStockAlertEmail(product, item.size, newSizeStock, 'out'), 'stock_alert')
                        .catch(err => logger.error('Stock alert email failed', { traceId, error: err.message }));
                }
            } else if (newSizeStock <= 10) {
                eventLogger.product.lowStock({ requestId, traceId, productId: item._id, productName: product.name, size: item.size, stock: newSizeStock, alert: 'low_stock' });
                if (process.env.NOTIFY_EMAIL) {
                    await sendEmail(process.env.NOTIFY_EMAIL, 'Low Stock Alert', getStockAlertEmail(product, item.size, newSizeStock, 'low'), 'stock_alert')
                        .catch(err => logger.error('Stock alert email failed', { traceId, error: err.message }));
                }
            }
        }
    } catch (error) {
        logger.error('Error updating stock', { traceId, error: error.message, stack: error.stack });
        throw error;
    }
};

const restoreProductStock = async (items, traceId = null) => {
    try {
        for (const item of items) {
            const product = await svc.db(traceId, 'findById', 'products', () =>
                productModel.findById(item._id)
            );
            if (!product) continue;
            const currentSizeStock = product.sizeStock instanceof Map
                ? (product.sizeStock.get(item.size) || 0)
                : (product.sizeStock?.[item.size] || 0);
            const restoredSizeStock = currentSizeStock + item.quantity;

            await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
                productModel.findByIdAndUpdate(item._id, { $set: { [`sizeStock.${item.size}`]: restoredSizeStock } })
            );

            const updatedProduct = await svc.db(traceId, 'findById', 'products', () =>
                productModel.findById(item._id)
            );
            let totalStock = 0;
            if (updatedProduct.sizeStock instanceof Map) {
                for (const [_, stock] of updatedProduct.sizeStock) totalStock += stock || 0;
            } else if (updatedProduct.sizeStock) {
                Object.values(updatedProduct.sizeStock).forEach(stock => { totalStock += stock || 0; });
            }

            await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
                productModel.findByIdAndUpdate(item._id, { stockQuantity: totalStock })
            );

            await cacheDel(KEYS.product(item._id));
            await cacheDel(KEYS.productList());
            await publish(CHANNELS.STOCK_UPDATED, {
                productId: item._id, size: item.size,
                newStock: restoredSizeStock, totalStock,
            });

            logger.info('Stock restored', { traceId, productId: item._id, size: item.size, restored: item.quantity });
        }
    } catch (error) {
        logger.error('Error restoring stock', { traceId, error: error.message });
        throw error;
    }
};

const validateStockAvailability = async (items, traceId = null) => {
    for (const item of items) {
        const product = await svc.db(traceId, 'findById', 'products', () =>
            productModel.findById(item._id)
        );
        if (!product) throw new Error(`Product not found: ${item.name}`);
        const currentSizeStock = product.sizeStock instanceof Map
            ? (product.sizeStock.get(item.size) || 0)
            : (product.sizeStock?.[item.size] || 0);
        if (currentSizeStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name} (Size: ${item.size}). Available: ${currentSizeStock}, Requested: ${item.quantity}`);
        }
    }
};

const placeOrder = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId, items, amount, address } = req.body;
        await validateStockAvailability(items, traceId);
        await updateProductStock(items, traceId);

        const newOrder = await svc.db(traceId, 'save', 'orders', async () => {
            const order = new orderModel({ userId, items, address, amount, paymentMethod: "COD", payment: false });
            await order.save();
            return order;
        });

        await cacheDel(KEYS.cart(userId));
        await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
            userModel.findByIdAndUpdate(userId, { cartData: {} })
        );

        eventLogger.order.placed({
            traceId, orderId: newOrder._id, userId,
            amount, itemCount: items.length, paymentMethod: 'COD',
            address: { city: address.city, country: address.country },
        });

        await orderQueue.add({ type: 'order_confirmed', orderId: newOrder._id, userId });
        res.json({ success: true, message: "Order Placed" });
    } catch (error) {
        logger.error('COD order failed', { traceId, error: error.message, userId: req.body?.userId });
        res.json({ success: false, message: error.message });
    }
};

const placeOrderStripe = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;
        await validateStockAvailability(items, traceId);
        await updateProductStock(items, traceId);

        const newOrder = await svc.db(traceId, 'save', 'orders', async () => {
            const order = new orderModel({ userId, items, address, amount, paymentMethod: "Stripe", payment: false });
            await order.save();
            return order;
        });

        eventLogger.order.paymentInitiated({ requestId, traceId, orderId: newOrder._id, userId, amount, provider: 'stripe' });

        const line_items = items.map((item) => ({
            price_data: { currency, product_data: { name: item.name }, unit_amount: item.price * 100 },
            quantity: item.quantity
        }));
        line_items.push({
            price_data: { currency, product_data: { name: 'Delivery Charges' }, unit_amount: deliveryCharge * 100 },
            quantity: 1
        });

        const session = await svc.external(traceId, 'stripe', 'checkout.sessions.create', () =>
            stripe.checkout.sessions.create({
                success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
                cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
                line_items, mode: 'payment',
            }),
            { amount, orderId: newOrder._id.toString() }
        );

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        eventLogger.order.paymentFailed({ requestId, traceId, error: error.message, provider: 'stripe', userId: req.body?.userId });
        res.json({ success: false, message: error.message });
    }
};

const verifyStripe = async (req, res) => {
    const { requestId, traceId } = req;
    const { orderId, success, userId } = req.body;
    try {
        if (success === "true") {
            await svc.db(traceId, 'findByIdAndUpdate', 'orders', () =>
                orderModel.findByIdAndUpdate(orderId, { payment: true })
            );
            const order = await svc.db(traceId, 'findById', 'orders', () =>
                orderModel.findById(orderId)
            );
            eventLogger.order.paymentSuccess({ requestId, traceId, orderId, userId, provider: 'stripe', amount: order.amount });
            await cacheDel(KEYS.cart(userId));
            await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
                userModel.findByIdAndUpdate(userId, { cartData: {} })
            );
            await orderQueue.add({ type: 'order_confirmed', orderId, userId });
            res.json({ success: true });
        } else {
            const order = await svc.db(traceId, 'findById', 'orders', () =>
                orderModel.findById(orderId)
            );
            if (order && order.items) await restoreProductStock(order.items, traceId);
            await svc.db(traceId, 'findByIdAndDelete', 'orders', () =>
                orderModel.findByIdAndDelete(orderId)
            );
            eventLogger.order.paymentFailed({ requestId, traceId, orderId, userId, provider: 'stripe', reason: 'user_cancelled' });
            res.json({ success: false });
        }
    } catch (error) {
        logger.error('Stripe verification failed', { traceId, orderId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const placeOrderPaystack = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers;
        await validateStockAvailability(items, traceId);
        await updateProductStock(items, traceId);

        const newOrder = await svc.db(traceId, 'save', 'orders', async () => {
            const order = new orderModel({ userId, items, address, amount, paymentMethod: "Paystack", payment: false });
            await order.save();
            return order;
        });

        eventLogger.order.paymentInitiated({ requestId, traceId, orderId: newOrder._id, userId, amount, provider: 'paystack' });

        const transaction = await svc.external(traceId, 'paystack', 'transaction.initialize', () =>
            paystack.transaction.initialize({
                amount: (amount + deliveryCharge) * 100,
                email: address.email,
                reference: `order_${newOrder._id}_${Date.now()}`,
                callback_url: `${origin}/verify-paystack?orderId=${newOrder._id}`,
                currency: currency.toUpperCase(),
                metadata: { orderId: newOrder._id.toString(), userId }
            }),
            { amount, orderId: newOrder._id.toString() }
        );

        res.json({ success: true, authorization_url: transaction.data.authorization_url });
    } catch (error) {
        eventLogger.order.paymentFailed({ requestId, traceId, error: error.message, provider: 'paystack', userId: req.body?.userId });
        res.json({ success: false, message: error.message });
    }
};

const verifyPaystack = async (req, res) => {
    const { requestId, traceId } = req;
    const { orderId, reference } = req.body;
    try {
        const response = await svc.external(traceId, 'paystack', 'transaction.verify', () =>
            paystack.transaction.verify(reference),
            { reference, orderId }
        );

        if (response.status) {
            await svc.db(traceId, 'findByIdAndUpdate', 'orders', () =>
                orderModel.findByIdAndUpdate(orderId, { payment: true })
            );
            const order = await svc.db(traceId, 'findById', 'orders', () =>
                orderModel.findById(orderId)
            );
            eventLogger.order.paymentSuccess({ requestId, traceId, orderId, provider: 'paystack', amount: order.amount, reference });
            await cacheDel(KEYS.cart(order.userId));
            await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
                userModel.findByIdAndUpdate(order.userId, { cartData: {} })
            );
            await orderQueue.add({ type: 'order_confirmed', orderId, userId: order.userId });
            res.json({ success: true });
        } else {
            const order = await svc.db(traceId, 'findById', 'orders', () =>
                orderModel.findById(orderId)
            );
            if (order && order.items) await restoreProductStock(order.items, traceId);
            await svc.db(traceId, 'findByIdAndDelete', 'orders', () =>
                orderModel.findByIdAndDelete(orderId)
            );
            eventLogger.order.paymentFailed({ requestId, traceId, orderId, provider: 'paystack', reason: 'verification_failed', reference });
            res.json({ success: false });
        }
    } catch (error) {
        logger.error('Paystack verification failed', { traceId, orderId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const allOrders = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const orders = await svc.db(traceId, 'find', 'orders', () =>
            orderModel.find({})
        );
        eventLogger.admin.orderManaged({ requestId, traceId, action: 'view_all_orders', count: orders.length });
        res.json({ success: true, orders });
    } catch (error) {
        logger.error('Failed to fetch all orders', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const userOrders = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId } = req.body;
        const orders = await svc.db(traceId, 'find', 'orders', () =>
            orderModel.find({ userId })
        );
        res.json({ success: true, orders });
    } catch (error) {
        logger.error('Failed to fetch user orders', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateStatus = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { orderId, status } = req.body;
        await svc.db(traceId, 'findByIdAndUpdate', 'orders', () =>
            orderModel.findByIdAndUpdate(orderId, { status })
        );
        eventLogger.order.statusUpdated({ requestId, traceId, orderId, status, updatedBy: req.body?.adminId || 'admin' });

        const order = await svc.db(traceId, 'findById', 'orders', () =>
            orderModel.findById(orderId)
        );
        if (order) {
            const emailHtml = getOrderStatusUpdateEmail(order);
            if (emailHtml) {
                let subject = `Your Order Status: ${status}`;
                if (emailHtml.includes("<title>")) {
                    subject = emailHtml.split('<title>')[1].split('</title>')[0];
                }
                await sendEmail(order.address.email, subject, emailHtml, 'status_update')
                    .catch(err => eventLogger.system.emailError({ requestId, traceId, error: err.message, type: 'status_update' }));
            }
        }
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        logger.error('Failed to update order status', { traceId, error: error.message });
        res.json({ success: false, message: "Error" });
    }
};

const updatePaymentStatus = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { orderId, payment } = req.body;
        await svc.db(traceId, 'findByIdAndUpdate', 'orders', () =>
            orderModel.findByIdAndUpdate(orderId, { payment })
        );
        logger.info('Payment status updated manually', { traceId, orderId, payment, updatedBy: 'admin' });
        res.json({ success: true, message: "Payment status updated successfully" });
    } catch (error) {
        logger.error('Failed to update payment status', { traceId, error: error.message });
        res.json({ success: false, message: "Error updating payment status" });
    }
};

export {
    verifyStripe, placeOrder, placeOrderStripe, placeOrderPaystack,
    allOrders, userOrders, updateStatus, verifyPaystack, updatePaymentStatus
};
