
import express from 'express';
import { db } from '../index.js';
import { ObjectId } from 'mongodb';

const router = express.Router();


// Get all books
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


// Get books added by a specific user
router.get('/my-books/:email', async (req, res) => {
    try {
        const email = req.params.email;

        const books = await db.collection('books')
            .find({ userEmail: email })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).send({
            success: true,
            books: books
        });

    } catch (error) {
        console.log('Get my books error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to fetch your books.'
        });
    }
});


// Get a single book by ID
router.get('/:id', async (req, res) => {
    try {
        const bookId = req.params.id;

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid book ID.'
            });
        }

        const book = await db.collection('books').findOne({
            _id: new ObjectId(bookId)
        });

        if (!book) {
            return res.status(404).send({
                success: false,
                message: 'Book not found.'
            });
        }

        res.status(200).send({
            success: true,
            book: book
        });

    } catch (error) {
        console.log('Get single book error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to fetch book details.'
        });
    }
});


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


// Update a book
router.put('/:id', async (req, res) => {
    try {
        const bookId = req.params.id;

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid book ID.'
            });
        }

        const {
            title,
            author,
            category,
            image,
            description
        } = req.body;

        if (!title || !author || !category || !image || !description) {
            return res.status(400).send({
                success: false,
                message: 'Please fill in all required fields.'
            });
        }

        const result = await db.collection('books').updateOne(
            { _id: new ObjectId(bookId) },
            {
                $set: {
                    title,
                    author,
                    category,
                    image,
                    description
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({
                success: false,
                message: 'Book not found.'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Book updated successfully!'
        });

    } catch (error) {
        console.log('Update book error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to update book.'
        });
    }
});


// Delete a book
router.delete('/:id', async (req, res) => {
    try {
        const bookId = req.params.id;

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid book ID.'
            });
        }

        const result = await db.collection('books').deleteOne({
            _id: new ObjectId(bookId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({
                success: false,
                message: 'Book not found.'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Book deleted successfully!'
        });

    } catch (error) {
        console.log('Delete book error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to delete book.'
        });
    }
});


export default router;
