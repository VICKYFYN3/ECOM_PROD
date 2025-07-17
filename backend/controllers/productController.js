// productController.js
import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';

const addProduct = async (req, res) => {
    // Check for Multer file size error
    if (req.fileSizeError) {
        return res.status(400).json({ success: false, message: "One or more images are too large. Maximum allowed size is 2MB per image." });
    }
    try {
        const { name, description, price, category, subCategory, sizes, bestseller, sizeStocks } = req.body;
        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );

        // Parse sizes and sizeStocks
        const parsedSizes = JSON.parse(sizes);
        const parsedSizeStocks = JSON.parse(sizeStocks);

        // Initialize sizeStock as a plain object (not Map) for consistency
        const sizeStock = {};
        let totalStockQuantity = 0;

        parsedSizes.forEach(size => {
            const stockForSize = parseInt(parsedSizeStocks[size]) || 0;
            sizeStock[size] = stockForSize;
            totalStockQuantity += stockForSize;
        });

        const productData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            sizes: parsedSizes,
            bestseller: bestseller === "true" ? true : false,
            image: imagesUrl,
            date: Date.now(),
            stockQuantity: totalStockQuantity, // Read-only total, calculated from size stocks
            sizeStock // Plain object, not Map
        }

        const product = new productModel(productData);
        await product.save()
        res.json({ success: true, message: "Product added" });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        // Ensure sizeStock is returned as plain object for frontend consistency
        const formattedProducts = products.map(product => ({
            ...product.toObject(),
            sizeStock: product.sizeStock instanceof Map 
                ? Object.fromEntries(product.sizeStock) 
                : product.sizeStock || {}
        }));
        res.json({ success: true, products: formattedProducts })
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "product removed" })
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const product = await productModel.findById(productId)
        // Ensure sizeStock is returned as plain object
        const formattedProduct = {
            ...product.toObject(),
            sizeStock: product.sizeStock instanceof Map 
                ? Object.fromEntries(product.sizeStock) 
                : product.sizeStock || {}
        };
        res.json({ success: true, product: formattedProduct })
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

const updateStock = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;

        // Validate required parameters
        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        if (!size) {
            return res.json({ 
                success: false, 
                message: "Size parameter is required for stock updates. Please specify which size to update." 
            });
        }

        if (quantity === undefined || quantity === null || isNaN(quantity)) {
            return res.json({ success: false, message: "Valid quantity is required" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Validate that the size exists for this product
        if (!product.sizes.includes(size)) {
            return res.json({
                success: false,
                message: `Size ${size} is not available for this product. Available sizes: ${product.sizes.join(', ')}`
            });
        }

        // Get current stock for this specific size - handle both Map and Object
        let currentSizeStock = 0;
        if (product.sizeStock instanceof Map) {
            currentSizeStock = product.sizeStock.get(size) || 0;
        } else {
            currentSizeStock = product.sizeStock?.[size] || 0;
        }

        const newSizeStock = currentSizeStock + parseInt(quantity);

        // Prevent negative stock
        if (newSizeStock < 0) {
            return res.json({
                success: false,
                message: `Cannot reduce stock for size ${size} below zero. Current stock: ${currentSizeStock}, Attempted change: ${quantity}`
            });
        }

        // Update ONLY the specified size stock
        const update = {
            $set: {
                [`sizeStock.${size}`]: newSizeStock
            }
        };

        await productModel.findByIdAndUpdate(productId, update);

        // Get the updated product to calculate new total stock
        const updatedProduct = await productModel.findById(productId);

        // Calculate total stock from all size stocks - handle both Map and Object
        let totalStock = 0;
        if (updatedProduct.sizeStock instanceof Map) {
            for (const [_, stock] of updatedProduct.sizeStock) {
                totalStock += stock || 0;
            }
        } else if (updatedProduct.sizeStock) {
            Object.values(updatedProduct.sizeStock).forEach(stock => {
                totalStock += stock || 0;
            });
        }

        // Update the total stock quantity (read-only field calculated from size stocks)
        await productModel.findByIdAndUpdate(productId, { stockQuantity: totalStock });

        // Get final updated product and format response
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
            newSizeStock: newSizeStock,
            changeAmount: parseInt(quantity)
        });
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

const updateProduct = async (req, res) => {
    try {
        const { productId } = req.query;
        const { name, description, price, category, subCategory, sizes, bestseller, sizeStocks } = req.body;
        
        // Check if product exists
        const existingProduct = await productModel.findById(productId);
        if (!existingProduct) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Handle new images if uploaded
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
                );
            }
        }

        // Parse sizes and sizeStocks
        const parsedSizes = JSON.parse(sizes);
        const parsedSizeStocks = JSON.parse(sizeStocks);

        // Calculate total stock from size stocks
        let totalStockQuantity = 0;
        const sizeStock = {};
        parsedSizes.forEach(size => {
            const stockForSize = parseInt(parsedSizeStocks[size]) || 0;
            sizeStock[size] = stockForSize;
            totalStockQuantity += stockForSize;
        });

        // Prepare update data
        const updateData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            sizes: parsedSizes,
            bestseller: bestseller === "true" ? true : false,
            stockQuantity: totalStockQuantity,
            sizeStock
        };

        // Only update images if new ones were uploaded
        if (newImages.length > 0) {
            updateData.image = newImages;
        }

        // Update the product
        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        );

        // Format response
        const formattedProduct = {
            ...updatedProduct.toObject(),
            sizeStock: updatedProduct.sizeStock instanceof Map 
                ? Object.fromEntries(updatedProduct.sizeStock) 
                : updatedProduct.sizeStock || {}
        };

        res.json({ 
            success: true, 
            message: "Product updated successfully",
            product: formattedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.json({success: false, message: error.message});
    }
}

export { addProduct, listProducts, removeProduct, singleProduct, updateStock, updateProduct};