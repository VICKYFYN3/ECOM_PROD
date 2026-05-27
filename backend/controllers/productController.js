import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import eventLogger from '../utils/eventLogger.js';
import logger from '../utils/logger.js';

const addProduct = async (req, res) => {
    const requestId = req.requestId;
    if (req.fileSizeError) {
        return res.status(400).json({ success: false, message: "One or more images are too large. Maximum allowed size is 2MB per image." });
    }
    try {
        const { name, description, price, category, subCategory, sizes, bestseller, sizeStocks } = req.body;
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];
        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        ).catch(err => {
            eventLogger.system.cloudinaryError({ requestId, error: err.message, context: 'product_image_upload' });
            throw err;
        });

        const parsedSizes = JSON.parse(sizes);
        const parsedSizeStocks = JSON.parse(sizeStocks);
        const sizeStock = {};
        let totalStockQuantity = 0;
        parsedSizes.forEach(size => {
            const stockForSize = parseInt(parsedSizeStocks[size]) || 0;
            sizeStock[size] = stockForSize;
            totalStockQuantity += stockForSize;
        });

        const productData = {
            name, description, price: Number(price), category, subCategory,
            sizes: parsedSizes, bestseller: bestseller === "true",
            image: imagesUrl, date: Date.now(),
            stockQuantity: totalStockQuantity, sizeStock
        };

        const product = new productModel(productData);
        await product.save();

        eventLogger.product.added({
            requestId,
            productId: product._id,
            name, category, subCategory,
            price: Number(price),
            totalStock: totalStockQuantity,
            imageCount: imagesUrl.length,
            addedBy: 'admin',
        });

        res.json({ success: true, message: "Product added" });
    } catch (error) {
        logger.error('Add product failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const listProducts = async (req, res) => {
    const requestId = req.requestId;
    try {
        const products = await productModel.find({});
        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            sizeStock: product.sizeStock instanceof Map
                ? Object.fromEntries(product.sizeStock)
                : product.sizeStock || {}
        }));
        res.json({ success: true, products: formattedProducts });
    } catch (error) {
        logger.error('List products failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const removeProduct = async (req, res) => {
    const requestId = req.requestId;
    try {
        const product = await productModel.findByIdAndDelete(req.body.id);
        eventLogger.product.deleted({
            requestId,
            productId: req.body.id,
            productName: product?.name,
            deletedBy: 'admin',
        });
        res.json({ success: true, message: "product removed" });
    } catch (error) {
        logger.error('Remove product failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const singleProduct = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        if (!product) {
            logger.warn('Product not found', { requestId, productId });
            return res.json({ success: false, message: 'Product not found' });
        }
        const formattedProduct = {
            ...product.toObject(),
            sizeStock: product.sizeStock instanceof Map
                ? Object.fromEntries(product.sizeStock)
                : product.sizeStock || {}
        };
        res.json({ success: true, product: formattedProduct });
    } catch (error) {
        logger.error('Get single product failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateStock = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { productId, quantity, size } = req.body;
        if (!productId) return res.json({ success: false, message: "Product ID is required" });
        if (!size) return res.json({ success: false, message: "Size parameter is required for stock updates." });
        if (quantity === undefined || quantity === null || isNaN(quantity)) return res.json({ success: false, message: "Valid quantity is required" });

        const product = await productModel.findById(productId);
        if (!product) return res.json({ success: false, message: "Product not found" });
        if (!product.sizes.includes(size)) {
            return res.json({ success: false, message: `Size ${size} is not available for this product. Available sizes: ${product.sizes.join(', ')}` });
        }

        let currentSizeStock = product.sizeStock instanceof Map
            ? product.sizeStock.get(size) || 0
            : product.sizeStock?.[size] || 0;

        const newSizeStock = currentSizeStock + parseInt(quantity);
        if (newSizeStock < 0) {
            return res.json({ success: false, message: `Cannot reduce stock for size ${size} below zero. Current stock: ${currentSizeStock}` });
        }

        await productModel.findByIdAndUpdate(productId, { $set: { [`sizeStock.${size}`]: newSizeStock } });
        const updatedProduct = await productModel.findById(productId);
        let totalStock = 0;
        if (updatedProduct.sizeStock instanceof Map) {
            for (const [_, stock] of updatedProduct.sizeStock) totalStock += stock || 0;
        } else if (updatedProduct.sizeStock) {
            Object.values(updatedProduct.sizeStock).forEach(stock => { totalStock += stock || 0; });
        }
        await productModel.findByIdAndUpdate(productId, { stockQuantity: totalStock });

        eventLogger.product.stockUpdated({
            requestId,
            productId,
            productName: product.name,
            size,
            previousStock: currentSizeStock,
            newStock: newSizeStock,
            change: parseInt(quantity),
            totalStock,
            updatedBy: 'admin',
        });

        if (newSizeStock === 0) {
            eventLogger.product.lowStock({ requestId, productId, productName: product.name, size, stock: 0, alert: 'out_of_stock' });
        } else if (newSizeStock <= 10) {
            eventLogger.product.lowStock({ requestId, productId, productName: product.name, size, stock: newSizeStock, alert: 'low_stock' });
        }

        const finalProduct = await productModel.findById(productId);
        const formattedSizeStock = finalProduct.sizeStock instanceof Map
            ? Object.fromEntries(finalProduct.sizeStock)
            : finalProduct.sizeStock || {};

        res.json({
            success: true,
            message: `Stock updated for size ${size}`,
            stockQuantity: totalStock,
            sizeStock: formattedSizeStock,
            updatedSize: size,
            previousStock: currentSizeStock,
            newSizeStock,
            changeAmount: parseInt(quantity)
        });
    } catch (error) {
        logger.error('Update stock failed', { requestId, error: error.message });
        res.json({ success: false, message: error.message });
    }
};

const updateProduct = async (req, res) => {
    const requestId = req.requestId;
    try {
        const { productId } = req.query;
        const { name, description, price, category, subCategory, sizes, bestseller, sizeStocks } = req.body;

        const existingProduct = await productModel.findById(productId);
        if (!existingProduct) return res.json({ success: false, message: "Product not found" });

        let newImages = [];
        if (req.files) {
            const imageFiles = [
                req.files.image1 && req.files.image1[0],
                req.files.image2 && req.files.image2[0],
                req.files.image3 && req.files.image3[0],
                req.files.image4 && req.files.image4[0]
            ].filter(item => item !== undefined);

            if (imageFiles.length > 0) {
                newImages = await Promise.all(
                    imageFiles.map(async (item) => {
                        let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                        return result.secure_url;
                    })
                ).catch(err => {
                    eventLogger.system.cloudinaryError({ requestId, error: err.message, context: 'product_update_image' });
                    throw err;
                });
            }
        }

        const parsedSizes = JSON.parse(sizes);
        const parsedSizeStocks = JSON.parse(sizeStocks);
        let totalStockQuantity = 0;
        const sizeStock = {};
        parsedSizes.forEach(size => {
            const stockForSize = parseInt(parsedSizeStocks[size]) || 0;
            sizeStock[size] = stockForSize;
            totalStockQuantity += stockForSize;
        });

        const updateData = {
            name, description, price: Number(price), category, subCategory,
            sizes: parsedSizes, bestseller: bestseller === "true",
            stockQuantity: totalStockQuantity, sizeStock
        };
        if (newImages.length > 0) updateData.image = newImages;

        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, { new: true });

        eventLogger.product.updated({
            requestId,
            productId,
            productName: name,
            updatedFields: Object.keys(updateData),
            updatedBy: 'admin',
        });

        const formattedProduct = {
            ...updatedProduct.toObject(),
            sizeStock: updatedProduct.sizeStock instanceof Map
                ? Object.fromEntries(updatedProduct.sizeStock)
                : updatedProduct.sizeStock || {}
        };

        res.json({ success: true, message: "Product updated successfully", product: formattedProduct });
    } catch (error) {
        logger.error('Update product failed', { requestId, error: error.message, stack: error.stack });
        res.json({ success: false, message: error.message });
    }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateStock, updateProduct };
