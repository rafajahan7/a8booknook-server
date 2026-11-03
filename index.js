
import express from 'express';
import { MongoClient } from 'mongodb';
import 'dotenv/config';
import cors from 'cors';

import bookRoutes from './routes/bookRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';

const app = express();
const PORT = 8000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000'
}));

app.use(express.json());

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);

export let db;

async function connectToMongoDB() {
    try {
        await client.connect();

        db = client.db('booknook');

        console.log('Successfully connected to MongoDB!');

    } catch (error) {
        console.log('MongoDB connection failed:', error);
        throw error;
    }
}

// Test route
app.get('/', (req, res) => {
    res.send('BookNook Server is Running!');
});

// Start server
async function startServer() {
    try {
        await connectToMongoDB();

        app.listen(PORT, () => {
            console.log(`BookNook server running on port ${PORT}`);
        });

    } catch (error) {
        console.log('Server could not start.');
    }
}

startServer();
