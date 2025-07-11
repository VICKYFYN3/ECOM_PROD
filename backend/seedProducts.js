import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import connectDB from './config/mongodb.js';
import productModel from './models/productModel.js';

const NUM_PRODUCTS = 100;

const categories = ['Men', 'Women', 'Kids'];
const subCategories = ['Topwear', 'Bottomwear', 'Winterwear'];
const sizesList = ['S', 'M', 'L', 'XL'];

function randomImages() {
  // Use placeholder images or random URLs
  return [faker.image.urlPicsumPhotos({ width: 400, height: 400 })];
}

function randomSizeStock(sizes) {
  const stock = {};
  sizes.forEach(size => {
    stock[size] = faker.number.int({ min: 0, max: 50 });
  });
  return stock;
}

async function seedProducts() {
  await connectDB();
  await productModel.deleteMany({}); // Optional: clear existing products

  const products = Array.from({ length: NUM_PRODUCTS }).map(() => {
    const sizes = faker.helpers.arrayElements(sizesList, faker.number.int({ min: 1, max: 4 }));
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.number.int({ min: 1000, max: 50000 }),
      category: faker.helpers.arrayElement(categories),
      subCategory: faker.helpers.arrayElement(subCategories),
      sizes,
      bestseller: faker.datatype.boolean(),
      image: randomImages(),
      date: Date.now(),
      averageRating: faker.number.float({ min: 0, max: 5, precision: 0.1 }),
      ratingCount: faker.number.int({ min: 0, max: 100 }),
      stockQuantity: faker.number.int({ min: 0, max: 200 }),
      sizeStock: randomSizeStock(sizes),
    };
  });

  await productModel.insertMany(products);
  console.log(`${NUM_PRODUCTS} products seeded!`);
  mongoose.connection.close();
}

seedProducts().catch(err => {
  console.error(err);
  mongoose.connection.close();
}); 