import mongoose from "mongoose";

const connectDB = async () => {

    await mongoose.connect(`${process.env.MONGODB_URI}/ecommerce`)
}

export default connectDB;