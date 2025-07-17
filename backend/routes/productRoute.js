// productRoute.js
import express from 'express';
import { addProduct, listProducts, removeProduct, singleProduct, updateStock, updateProduct } from '../controllers/productController.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

// Middleware to catch Multer file size errors
function multerFileSizeErrorHandler(err, req, res, next) {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
        req.fileSizeError = true;
        // Call next so controller can handle the error and return a custom message
        return next();
    }
    // If it's another error, pass it along
    if (err) return next(err);
    next();
}

productRouter.post('/add',adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), multerFileSizeErrorHandler, addProduct);
productRouter.post('/remove',adminAuth, removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProducts);
productRouter.post('/update-stock', adminAuth, updateStock);
productRouter.post('/update', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), multerFileSizeErrorHandler, updateProduct);

export default productRouter;