import reviewModel from '../models/reviewModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import logger from '../utils/logger.js';
import svc from '../utils/serviceLogger.js';
import { RC, getUserMessage } from '../utils/responseCodes.js';

const getUserReviews = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const reviews = await svc.db(traceId, 'find', 'reviews', () =>
            reviewModel.find({ userId: req.body.userId }).populate('productId', 'name image')
        );
        const transformedReviews = reviews.map(review => ({
            _id: review._id, rating: review.rating, createdAt: review.createdAt,
            product: { _id: review.productId._id, name: review.productId.name, image: review.productId.image }
        }));
        res.json({ success: true, reviews: transformedReviews });
    } catch (error) {
        logger.error('Get user reviews failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const addReview = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { productId, rating } = req.body;
        const existingReview = await svc.db(traceId, 'findOne', 'reviews', () =>
            reviewModel.findOne({ userId: req.body.userId, productId })
        );
        if (existingReview) return res.json({ success: false, message: 'You have already reviewed this product', requestId });
        const newReview = await svc.db(traceId, 'save', 'reviews', async () => {
            const r = new reviewModel({ userId: req.body.userId, productId, rating });
            await r.save();
            return r;
        });
        await updateProductRating(productId, traceId);
        res.json({ success: true, review: newReview });
    } catch (error) {
        logger.error('Add review failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const updateReview = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { reviewId, rating } = req.body;
        const updatedReview = await svc.db(traceId, 'findByIdAndUpdate', 'reviews', () =>
            reviewModel.findByIdAndUpdate(reviewId, { rating }, { new: true })
        );
        await updateProductRating(updatedReview.productId, traceId);
        res.json({ success: true, review: updatedReview });
    } catch (error) {
        logger.error('Update review failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const deleteReview = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { reviewId } = req.body;
        const review = await svc.db(traceId, 'findById', 'reviews', () => reviewModel.findById(reviewId));
        if (!review) return res.json({ success: false, message: getUserMessage(RC.RES_05 ? RC.RES_05.code : RC.SYS_01.code), requestId });
        await svc.db(traceId, 'findByIdAndDelete', 'reviews', () => reviewModel.findByIdAndDelete(reviewId));
        await updateProductRating(review.productId, traceId);
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        logger.error('Delete review failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const getReviewableProducts = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const orders = await svc.db(traceId, 'find', 'orders', () =>
            orderModel.find({ userId: req.body.userId, status: 'Delivered' })
        );
        const reviewedProducts = await svc.db(traceId, 'distinct', 'reviews', () =>
            reviewModel.find({ userId: req.body.userId }).distinct('productId')
        );
        const reviewedProductIds = reviewedProducts.map(id => id.toString());
        const reviewableProducts = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                const productId = item._id;
                if (productId && !reviewedProductIds.includes(productId.toString())) {
                    const exists = reviewableProducts.some(p => p._id.toString() === productId.toString());
                    if (!exists) reviewableProducts.push({ _id: productId, name: item.name, image: item.image, createdAt: order.createdAt });
                }
            });
        });
        res.json({ success: true, products: reviewableProducts });
    } catch (error) {
        logger.error('Get reviewable products failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const updateProductRating = async (productId, traceId = null) => {
    const reviews = await svc.db(traceId, 'find', 'reviews', () => reviewModel.find({ productId }));
    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
            productModel.findByIdAndUpdate(productId, { averageRating, ratingCount: reviews.length })
        );
    } else {
        await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
            productModel.findByIdAndUpdate(productId, { averageRating: 0, ratingCount: 0 })
        );
    }
};

export { getUserReviews, addReview, updateReview, deleteReview, getReviewableProducts };
