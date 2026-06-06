import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import eventLogger from '../utils/eventLogger.js';
import logger from '../utils/logger.js';
import { KEYS, TTL, cacheGet, cacheSet, cacheDel, CHANNELS } from '../utils/cache.js';
import { publish } from '../utils/pubsub.js';
import svc from '../utils/serviceLogger.js';
import { RC, getUserMessage } from '../utils/responseCodes.js';

const addProduct = async (req, res) => {
    const { requestId, traceId } = req;
    if (req.fileSizeError) return res.status(400).json({ success: false, message: getUserMessage(RC.UPL_02.code), requestId });
    try {
        const { name, description, price, category, subCategory, sizes, bestseller, sizeStocks } = req.body;
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];
        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                const result = await svc.cloudinary(traceId, 'upload', () =>
                    cloudinary.uploader.upload(item.path, { resource_type: 'image' }),
                    { context: 'product_image' }
                );
                return result.secure_url;
            })
        );

        const parsedSizes = JSON.parse(sizes);
        const parsedSizeStocks = JSON.parse(sizeStocks);
        const sizeStock = {};
        let totalStockQuantity = 0;
        parsedSizes.forEach(size => {
            const stockForSize = parseInt(parsedSizeStocks[size]) || 0;
            sizeStock[size] = stockForSize;
            totalStockQuantity += stockForSize;
        });

        const product = await svc.db(traceId, 'save', 'products', async () => {
            const p = new productModel({
                name, description, price: Number(price), category, subCategory,
                sizes: parsedSizes, bestseller: bestseller === "true",
                image: imagesUrl, date: Date.now(),
                stockQuantity: totalStockQuantity, sizeStock
            });
            await p.save();
            return p;
        });

        await cacheDel(KEYS.productList());
        await publish(CHANNELS.PRODUCT_UPDATED, { action: 'added', productId: product._id, name });
        eventLogger.product.added({
            requestId, traceId, productId: product._id, name, category,
            subCategory, price: Number(price), totalStock: totalStockQuantity,
            imageCount: imagesUrl.length, addedBy: 'admin',
            responseCode: RC.PRD_00.code, responseMessage: RC.PRD_00.message,
        });
        res.json({ success: true, message: "Product added" });
    } catch (error) {
        logger.error('Add product failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const listProducts = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const cached = await cacheGet(KEYS.productList());
        if (cached) return res.json({ success: true, products: cached });
        const products = await svc.db(traceId, 'find', 'products', () =>
            productModel.find({})
        );
        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            sizeStock: product.sizeStock instanceof Map
                ? Object.fromEntries(product.sizeStock) : product.sizeStock || {}
        }));
        await cacheSet(KEYS.productList(), formattedProducts, TTL.PRODUCT_LIST);
        res.json({ success: true, products: formattedProducts });
    } catch (error) {
        logger.error('List products failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const removeProduct = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const product = await svc.db(traceId, 'findByIdAndDelete', 'products', () =>
            productModel.findByIdAndDelete(req.body.id)
        );
        await cacheDel(KEYS.productList());
        await cacheDel(KEYS.product(req.body.id));
        await publish(CHANNELS.PRODUCT_DELETED, { productId: req.body.id, productName: product?.name });
        eventLogger.product.deleted({ requestId, traceId, productId: req.body.id, productName: product?.name, deletedBy: 'admin', responseCode: RC.PRD_02.code, responseMessage: RC.PRD_02.message });
        res.json({ success: true, message: "product removed" });
    } catch (error) {
        logger.error('Remove product failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const singleProduct = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { productId } = req.body;
        const cached = await cacheGet(KEYS.product(productId));
        if (cached) return res.json({ success: true, product: cached });
        const product = await svc.db(traceId, 'findById', 'products', () =>
            productModel.findById(productId)
        );
        if (!product) return res.json({ success: false, message: getUserMessage(RC.PRD_03.code), requestId });
        const formattedProduct = {
            ...product.toObject(),
            sizeStock: product.sizeStock instanceof Map
                ? Object.fromEntries(product.sizeStock) : product.sizeStock || {}
        };
        await cacheSet(KEYS.product(productId), formattedProduct, TTL.SINGLE_PRODUCT);
        res.json({ success: true, product: formattedProduct });
    } catch (error) {
        logger.error('Get single product failed', { traceId, error: error.message, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const updateStock = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { productId, quantity, size } = req.body;
        if (!productId) return res.json({ success: false, message: getUserMessage(RC.VAL_01.code), requestId });
        if (!size) return res.json({ success: false, message: getUserMessage(RC.VAL_01.code), requestId });
        if (quantity === undefined || quantity === null || isNaN(quantity)) return res.json({ success: false, message: getUserMessage(RC.VAL_03.code), requestId });

        const product = await svc.db(traceId, 'findById', 'products', () =>
            productModel.findById(productId)
        );
        if (!product) return res.json({ success: false, message: getUserMessage(RC.PRD_03.code), requestId });
        if (!product.sizes.includes(size)) return res.json({ success: false, message: `Size ${size} is not available. Available: ${product.sizes.join(', ')}`, requestId });

        let currentSizeStock = product.sizeStock instanceof Map
            ? product.sizeStock.get(size) || 0 : product.sizeStock?.[size] || 0;
        const newSizeStock = currentSizeStock + parseInt(quantity);
        if (newSizeStock < 0) return res.json({ success: false, message: `Cannot reduce stock below zero. Current: ${currentSizeStock}`, requestId });

        await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
            productModel.findByIdAndUpdate(productId, { $set: { [`sizeStock.${size}`]: newSizeStock } })
        );
        const updatedProduct = await svc.db(traceId, 'findById', 'products', () =>
            productModel.findById(productId)
        );
        let totalStock = 0;
        if (updatedProduct.sizeStock instanceof Map) {
            for (const [_, stock] of updatedProduct.sizeStock) totalStock += stock || 0;
        } else if (updatedProduct.sizeStock) {
            Object.values(updatedProduct.sizeStock).forEach(stock => { totalStock += stock || 0; });
        }
        await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
            productModel.findByIdAndUpdate(productId, { stockQuantity: totalStock })
        );

        await cacheDel(KEYS.product(productId));
        await cacheDel(KEYS.productList());
        await publish(CHANNELS.STOCK_UPDATED, {
            productId, productName: product.name, size,
            previousStock: currentSizeStock, newStock: newSizeStock, totalStock,
        });
        eventLogger.product.stockUpdated({
            requestId, traceId, productId, productName: product.name, size,
            previousStock: currentSizeStock, newStock: newSizeStock,
            change: parseInt(quantity), totalStock, updatedBy: 'admin',
            responseCode: RC.STK_00.code, responseMessage: RC.STK_00.message,
        });
        if (newSizeStock === 0) eventLogger.product.lowStock({ requestId, traceId, productId, productName: product.name, size, stock: 0, alert: 'out_of_stock', responseCode: RC.STK_04.code, responseMessage: RC.STK_04.message });
        else if (newSizeStock <= 10) eventLogger.product.lowStock({ requestId, traceId, productId, productName: product.name, size, stock: newSizeStock, alert: 'low_stock', responseCode: RC.STK_03.code, responseMessage: RC.STK_03.message });

        const finalProduct = await svc.db(traceId, 'findById', 'products', () =>
            productModel.findById(productId)
        );
        const formattedSizeStock = finalProduct.sizeStock instanceof Map
            ? Object.fromEntries(finalProduct.sizeStock) : finalProduct.sizeStock || {};
        res.json({
            success: true, message: `Stock updated for size ${size}`,
            stockQuantity: totalStock, sizeStock: formattedSizeStock,
            updatedSize: size, previousStock: currentSizeStock,
            newSizeStock, changeAmount: parseInt(quantity)
        });
    } catch (error) {
        logger.error('Update stock failed', { traceId, error: error.message, responseCode: RC.STK_02.code, responseMessage: RC.STK_02.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

const updateProduct = async (req, res) => {
    const { requestId, traceId } = req;
    try {
        const { productId } = req.query;
        const { name, description, price, category, subCategory, sizes, bestseller, sizeStocks } = req.body;
        const existingProduct = await svc.db(traceId, 'findById', 'products', () =>
            productModel.findById(productId)
        );
        if (!existingProduct) return res.json({ success: false, message: getUserMessage(RC.PRD_03.code), requestId });

        let newImages = [];
        if (req.files) {
            const imageFiles = [
                req.files.image1 && req.files.image1[0], req.files.image2 && req.files.image2[0],
                req.files.image3 && req.files.image3[0], req.files.image4 && req.files.image4[0]
            ].filter(item => item !== undefined);
            if (imageFiles.length > 0) {
                newImages = await Promise.all(
                    imageFiles.map(async (item) => {
                        const result = await svc.cloudinary(traceId, 'upload', () =>
                            cloudinary.uploader.upload(item.path, { resource_type: 'image' }),
                            { context: 'product_update_image' }
                        );
                        return result.secure_url;
                    })
                );
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

        const updatedProduct = await svc.db(traceId, 'findByIdAndUpdate', 'products', () =>
            productModel.findByIdAndUpdate(productId, updateData, { new: true })
        );
        await cacheDel(KEYS.product(productId));
        await cacheDel(KEYS.productList());
        await publish(CHANNELS.PRODUCT_UPDATED, { action: 'updated', productId, productName: name });
        eventLogger.product.updated({ requestId, traceId, productId, productName: name, updatedFields: Object.keys(updateData), updatedBy: 'admin', responseCode: RC.PRD_01.code, responseMessage: RC.PRD_01.message });

        const formattedProduct = {
            ...updatedProduct.toObject(),
            sizeStock: updatedProduct.sizeStock instanceof Map
                ? Object.fromEntries(updatedProduct.sizeStock) : updatedProduct.sizeStock || {}
        };
        res.json({ success: true, message: "Product updated successfully", product: formattedProduct });
    } catch (error) {
        logger.error('Update product failed', { traceId, error: error.message, stack: error.stack, responseCode: RC.SYS_01.code, responseMessage: RC.SYS_01.message });
        res.json({ success: false, message: getUserMessage(RC.SYS_01.code), requestId });
    }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateStock, updateProduct };
