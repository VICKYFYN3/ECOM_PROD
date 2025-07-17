import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import reviewRouter from './routes/reviewRoute.js';
import addressRouter from './routes/addressRoute.js';
import contactRouter from './routes/contactRoute.js';

// App Configuration
const app = express();
const port = process.env.PORT || 4001;
connectDB();
connectCloudinary();
// Middlewares
app.use(express.json());
app.use(cors());

// api endpoints
app.use('/api/user',userRouter);
app.use('/api/product',productRouter);
app.use('/api/cart',cartRouter);
app.use('/api/order',orderRouter)
app.use('/api/review',reviewRouter)
app.use('/api/address',addressRouter)
app.use('/api/contact',contactRouter)


app.get('/',(req,res)=>{
    res.send("API is running");
});

app.listen(port, () =>console.log(`Server is running on port `+port));