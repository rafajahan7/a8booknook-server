
import express from 'express';
import { db } from '../index.js';

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const books = await db.collection('books')
            .find()
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).send({
            success: true,
            books: books
        });

    } catch (error) {
        console.log('Get books error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to fetch books.'
        });
    }
});


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
