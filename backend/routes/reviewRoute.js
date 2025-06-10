import express from 'express';
import  authUser  from '../middleware/auth.js';
import { 
    getUserReviews,
    addReview,
    updateReview,
    deleteReview,
    getReviewableProducts
} from '../controllers/reviewController.js';

const reviewRouter = express.Router();

reviewRouter.post('/list', authUser, getUserReviews);
reviewRouter.post('/add', authUser, addReview);
reviewRouter.post('/update', authUser, updateReview);
reviewRouter.post('/delete', authUser, deleteReview);
reviewRouter.post('/reviewable-products', authUser, getReviewableProducts);

export default reviewRouter;