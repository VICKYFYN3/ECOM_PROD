import userModel from "../models/userModel.js";
import logger from "../utils/logger.js";
import { KEYS, TTL, cacheGet, cacheSet, cacheDel } from "../utils/cache.js";
import svc from "../utils/serviceLogger.js";

const addToCart = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId, itemId, size } = req.body;
        const userData = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId)
        );
        let cartData = await userData.cartData;
        if (cartData[itemId]) {
            cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
            userModel.findByIdAndUpdate(userId, { cartData })
        );
        await cacheSet(KEYS.cart(userId), cartData, TTL.CART);
        logger.info('Item added to cart', { traceId, userId, itemId, size, quantity: cartData[itemId][size] });
        res.json({ success: true, message: 'Added to Cart' });
    } catch (error) {
        logger.error('Add to cart failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateCart = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId, itemId, size, quantity } = req.body;
        const userData = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId)
        );
        let cartData = await userData.cartData;
        cartData[itemId][size] = quantity;
        await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
            userModel.findByIdAndUpdate(userId, { cartData })
        );
        await cacheSet(KEYS.cart(userId), cartData, TTL.CART);
        logger.info('Cart updated', { traceId, userId, itemId, size, quantity });
        res.json({ success: true, message: "Cart Updated" });
    } catch (error) {
        logger.error('Update cart failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const getUserCart = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId } = req.body;
        const cached = await cacheGet(KEYS.cart(userId));
        if (cached) return res.json({ success: true, cartData: cached });
        const userData = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId)
        );
        let cartData = await userData.cartData;
        await cacheSet(KEYS.cart(userId), cartData, TTL.CART);
        res.json({ success: true, cartData });
    } catch (error) {
        logger.error('Get cart failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const removeFromCart = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { userId, itemId, size } = req.body;
        const userData = await svc.db(traceId, 'findById', 'users', () =>
            userModel.findById(userId)
        );
        let cartData = userData.cartData;
        if (cartData[itemId] && cartData[itemId][size]) {
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];
            await svc.db(traceId, 'findByIdAndUpdate', 'users', () =>
                userModel.findByIdAndUpdate(userId, { cartData })
            );
            await cacheSet(KEYS.cart(userId), cartData, TTL.CART);
            logger.info('Item removed from cart', { traceId, userId, itemId, size });
            res.json({ success: true, message: "Item removed from cart" });
        } else {
            res.json({ success: false, message: "Item not found in cart" });
        }
    } catch (error) {
        logger.error('Remove from cart failed', { traceId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart, removeFromCart };
