// productModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    category: {type: String, required: true},
    subCategory: {type: String, required: true},
    sizes: {type: Array, required: true},
    bestseller: {type: Boolean},
    image: {type: Array, required: true},
    date: {type: Number, required: true},
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    stockQuantity: { type: Number, required: true, default: 0 },
    sizeStock: { 
        type: Map, 
        of: Number,
        default: {} 
    }
});

const productModel = mongoose.models.product ||  mongoose.model("product", productSchema);

export default productModel;