import reviewModel from '../models/reviewModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';
import logger from '../utils/logger.js';

const getUserReviews = async (req, res) => {
    const requestId = req.requestId;
    try {
        const reviews = await reviewModel.find({ userId: req.body.userId }).populate('productId', 'name image');
        const transformedReviews = reviews.map(review => ({
            _id: review._id, rating: review.rating, createdAt: review.createdAt,
            product: { _id: review.productId._id, name: review.productId.name, image: review.productId.image }
        }));
        res.json({ success: true, reviews: transformedReviews });
    } catch (error) {
        logger.error('Get user reviews failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const addReview = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { productId, rating } = req.body;
        const existingReview = await reviewModel.findOne({ userId: req.body.userId, productId });
        if (existingReview) {
            return res.json({ success: false, message: 'You have already reviewed this product' });
        }
        const newReview = new reviewModel({ userId: req.body.userId, productId, rating });
        await newReview.save();
        await updateProductRating(productId);
        logger.info('Review added', { requestId, userId: req.body.userId, productId, rating });
        res.json({ success: true, review: newReview });
    } catch (error) {
        logger.error('Add review failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateReview = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { reviewId, rating } = req.body;
        const updatedReview = await reviewModel.findByIdAndUpdate(reviewId, { rating }, { new: true });
        await updateProductRating(updatedReview.productId);
        logger.info('Review updated', { requestId, reviewId, rating, userId: req.body.userId });
        res.json({ success: true, review: updatedReview });
    } catch (error) {
        logger.error('Update review failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const deleteReview = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { reviewId } = req.body;
        const review = await reviewModel.findById(reviewId);
        if (!review) return res.json({ success: false, message: 'Review not found' });
        await reviewModel.findByIdAndDelete(reviewId);
        await updateProductRating(review.productId);
        logger.info('Review deleted', { requestId, reviewId, userId: req.body.userId, productId: review.productId });
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        logger.error('Delete review failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const getReviewableProducts = async (req, res) => {
    const requestId = req.requestId;
    try {
        const allOrders = await orderModel.find({ userId: req.body.userId });
        const orders = await orderModel.find({ userId: req.body.userId, status: 'Delivered' });
        const reviewedProducts = await reviewModel.find({ userId: req.body.userId }).distinct('productId');
        const reviewedProductIds = reviewedProducts.map(id => id.toString());
        const reviewableProducts = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                const productId = item._id;
                if (productId && !reviewedProductIds.includes(productId.toString())) {
                    const exists = reviewableProducts.some(p => p._id.toString() === productId.toString());
                    if (!exists) {
                        reviewableProducts.push({ _id: productId, name: item.name, image: item.image, createdAt: order.createdAt });
                    }
                }
            });
        });
        res.json({ success: true, products: reviewableProducts });
    } catch (error) {
        logger.error('Get reviewable products failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateProductRating = async (productId) => {
    const reviews = await reviewModel.find({ productId });
    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        await productModel.findByIdAndUpdate(productId, { averageRating, ratingCount: reviews.length });
    } else {
        await productModel.findByIdAndUpdate(productId, { averageRating: 0, ratingCount: 0 });
    }
};

export { getUserReviews, addReview, updateReview, deleteReview, getReviewableProducts };
