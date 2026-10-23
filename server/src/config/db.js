import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/evidenceloop';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${uri}: ${error.message}`);
    console.warn('[Database Notice] API will serve requests with in-memory persistence until MongoDB connection is established.');
    return null;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export default connectDB;
