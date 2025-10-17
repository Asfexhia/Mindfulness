import mongoose from "mongoose";


export const Connection = async () => {
    const URL = process.env.MONGODB_URL;
    
    console.log('Attempting to connect to MongoDB with URL:', URL);
    console.log('MongoDB connection state before connect:', mongoose.connection.readyState);

    try {
        await mongoose.connect(URL);
        console.log ('Database connected successfully!!!');
        console.log('MongoDB connection state after connect:', mongoose.connection.readyState);
    } catch (error) {
        console.log ('Error while connecting with the database', error.message);
        console.log('Full error:', error);
    }
}

export default Connection;