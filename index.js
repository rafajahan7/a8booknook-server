
import express from 'express';
import { MongoClient } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';

import bookRoutes from './routes/bookRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';

const app = express();

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

export let db;

let connectionPromise;

async function connectToMongoDB() {
    if (db) {
        return db;
    }

    if (!connectionPromise) {
        connectionPromise = client.connect()
            .then(() => {
                db = client.db('booknook');

                console.log('Successfully connected to MongoDB!');

                return db;
            })
            .catch((error) => {
                connectionPromise = null;

                console.log('MongoDB connection failed:', error);

                throw error;
            });
    }

    return connectionPromise;
}

// Middleware
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000"
];

app.use(cors({
    origin: allowedOrigins
}));

app.use(express.json());

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
    try {
        await connectToMongoDB();
        next();
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Database connection failed.'
        });
    }
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('BookNook Server is Running!');
});

// Export Express app for Vercel
export default app;
