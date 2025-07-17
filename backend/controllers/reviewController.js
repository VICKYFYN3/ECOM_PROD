// reviewController.js
import reviewModel from '../models/reviewModel.js';
import orderModel from '../models/orderModel.js';
import productModel from '../models/productModel.js';

const getUserReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.find({ userId: req.body.userId })
            .populate('productId', 'name image');
        
        // Transform the data to match frontend expectations
        const transformedReviews = reviews.map(review => ({
            _id: review._id,
            rating: review.rating,
            createdAt: review.createdAt,
            product: {
                _id: review.productId._id,
                name: review.productId.name,
                image: review.productId.image
            }
        }));
        
        res.json({ success: true, reviews: transformedReviews });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const addReview = async (req, res) => {
    try {
        const { productId, rating } = req.body;
        const existingReview = await reviewModel.findOne({
            userId: req.body.userId,
            productId
        });
        
        if (existingReview) {
            return res.json({ success: false, message: 'You have already reviewed this product' });
        }
        
        const newReview = new reviewModel({
            userId: req.body.userId,
            productId,
            rating
        });
        
        await newReview.save();
        
        // Update product's average rating
        await updateProductRating(productId);
        
        res.json({ success: true, review: newReview });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateReview = async (req, res) => {
    try {
        const { reviewId, rating } = req.body;
        
        const updatedReview = await reviewModel.findByIdAndUpdate(
            reviewId,
            { rating },
            { new: true }
        );
        
        // Update product's average rating
        await updateProductRating(updatedReview.productId);
        
        res.json({ success: true, review: updatedReview });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.body;
        const review = await reviewModel.findById(reviewId);
        
        if (!review) {
            return res.json({ success: false, message: 'Review not found' });
        }
        
        await reviewModel.findByIdAndDelete(reviewId);
        
        // Update product's average rating
        await updateProductRating(review.productId);
        
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const getReviewableProducts = async (req, res) => {
    try {
        
        // First, let's check all orders for this user
        const allOrders = await orderModel.find({ userId: req.body.userId });
        
        // Log all order statuses
        allOrders.forEach(order => {
        });
        
        const orders = await orderModel.find({
            userId: req.body.userId,
            status: 'Delivered'
        });

        // Get all product IDs that the user has already reviewed
        const reviewedProducts = await reviewModel.find({
            userId: req.body.userId
        }).distinct('productId');

        // Convert to strings for comparison
        const reviewedProductIds = reviewedProducts.map(id => id.toString());

        const reviewableProducts = [];
        
        orders.forEach(order => {
            order.items.forEach(item => {
                // The item contains the product's _id, not its own _id
                const productId = item._id;
                
                // Make sure item has a product ID and hasn't been reviewed
                if (productId && !reviewedProductIds.includes(productId.toString())) {
                    // Check if this product is already in our reviewableProducts array
                    const exists = reviewableProducts.some(p => 
                        p._id.toString() === productId.toString()
                    );
                    
                    if (!exists) {
                        reviewableProducts.push({
                            _id: productId,
                            name: item.name,
                            image: item.image,
                            createdAt: order.createdAt
                        });
                    }
                }
            });
        });

        res.json({
            success: true,
            products: reviewableProducts
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateProductRating = async (productId) => {
    const reviews = await reviewModel.find({ productId });
    
    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        await productModel.findByIdAndUpdate(productId, {
            averageRating,
            ratingCount: reviews.length
        });
    } else {
        await productModel.findByIdAndUpdate(productId, {
            averageRating: 0,
            ratingCount: 0
        });
    }
};

export { getUserReviews, addReview, updateReview, deleteReview, getReviewableProducts };