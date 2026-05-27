import userModel from "../models/userModel.js";
import logger from "../utils/logger.js";

const addToCart = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { userId, itemId, size } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = await userData.cartData;
        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        await userModel.findByIdAndUpdate(userId, { cartData });
        logger.info('Item added to cart', { requestId, userId, itemId, size, quantity: cartData[itemId][size] });
        res.json({ success: true, message: 'Added to Cart' });
    } catch (error) {
        logger.error('Add to cart failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateCart = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { userId, itemId, size, quantity } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = await userData.cartData;
        cartData[itemId][size] = quantity;
        await userModel.findByIdAndUpdate(userId, { cartData });
        logger.info('Cart updated', { requestId, userId, itemId, size, quantity });
        res.json({ success: true, message: "Cart Updated" });
    } catch (error) {
        logger.error('Update cart failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const getUserCart = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { userId } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = await userData.cartData;
        res.json({ success: true, cartData });
    } catch (error) {
        logger.error('Get cart failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const removeFromCart = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { userId, itemId, size } = req.body;
        const userData = await userModel.findById(userId);
        let cartData = userData.cartData;
        if (cartData[itemId] && cartData[itemId][size]) {
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
            await userModel.findByIdAndUpdate(userId, { cartData });
            logger.info('Item removed from cart', { requestId, userId, itemId, size });
            res.json({ success: true, message: "Item removed from cart" });
        } else {
            res.json({ success: false, message: "Item not found in cart" });
        }
    } catch (error) {
        logger.error('Remove from cart failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart, removeFromCart };
