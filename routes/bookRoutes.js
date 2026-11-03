
import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Add a new book
router.post('/add-book', async (req, res) => {
    try {
        const {
            title,
            author,
            category,
            image,
            description,
            userName,
            userEmail
        } = req.body;

        // Check required fields
        if (
            !title ||
            !author ||
            !category ||
            !image ||
            !description ||
            !userName ||
            !userEmail
        ) {
            return res.status(400).send({
                success: false,
                message: 'Please fill in all required fields.'
            });
        }

        // Book information
        const newBook = {
            title,
            author,
            category,
            image,
            description,
            userName,
            userEmail,

            price: 0,
            publishedYear: new Date().getFullYear(),

            availableCopies: 1,
            totalCopies: 1,

            createdAt: new Date(),

            rating: 0,
            featured: false
        };

        // Save book in MongoDB
        const result = await db.collection('books').insertOne(newBook);

        res.status(201).send({
            success: true,
            message: 'Book added successfully!',
            bookId: result.insertedId
        });

    } catch (error) {
        console.log('Add book error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to add book.'
        });
    }
});

export default router;
