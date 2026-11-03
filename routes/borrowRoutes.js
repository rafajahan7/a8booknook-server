
import express from 'express';
import { db } from '../index.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Temporary Demo User
const DEMO_USER_EMAIL = 'demo@booknook.com';


// Borrow a book
router.post('/', async (req, res) => {
    try {
        const { bookId } = req.body;

        if (!bookId) {
            return res.status(400).send({
                success: false,
                message: 'Book ID is required.'
            });
        }

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid book ID.'
            });
        }

        // Check whether the book exists
        const book = await db.collection('books').findOne({
            _id: new ObjectId(bookId)
        });

        if (!book) {
            return res.status(404).send({
                success: false,
                message: 'Book not found.'
            });
        }

        // Decrease available copies
        const result = await db.collection('books').updateOne(
            {
                _id: new ObjectId(bookId),
                availableCopies: { $gt: 0 }
            },
            {
                $inc: { availableCopies: -1 }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).send({
                success: false,
                message: 'This book is currently unavailable.'
            });
        }

        const borrowDate = new Date();
        const returnDate = new Date();

        // Set return date to 14 days later
        returnDate.setDate(returnDate.getDate() + 14);

        const borrowData = {
            bookId: new ObjectId(bookId),
            bookTitle: book.title,
            bookImage: book.image,
            userEmail: DEMO_USER_EMAIL,
            borrowDate: borrowDate,
            returnDate: returnDate,
            returned: false
        };

        // Save borrowing information
        try {
            await db.collection('borrows').insertOne(borrowData);
        } catch (error) {
            // Restore the copy if saving the borrow record fails
            await db.collection('books').updateOne(
                { _id: new ObjectId(bookId) },
                { $inc: { availableCopies: 1 } }
            );

            throw error;
        }

        res.status(201).send({
            success: true,
            message: 'Book borrowed successfully!'
        });

    } catch (error) {
        console.log('Borrow book error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to borrow book.'
        });
    }
});


// Get borrowed books of the logged-in user
router.get('/', async (req, res) => {
    try {
        const borrows = await db.collection('borrows')
            .find({ userEmail: DEMO_USER_EMAIL })
            .sort({ borrowDate: -1 })
            .toArray();

        res.status(200).send({
            success: true,
            borrows: borrows
        });

    } catch (error) {
        console.log('Get my borrows error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to fetch borrowed books.'
        });
    }
});


// Return a borrowed book
router.delete('/:id', async (req, res) => {
    try {
        const borrowId = req.params.id;

        if (!ObjectId.isValid(borrowId)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid borrow ID.'
            });
        }

        const borrow = await db.collection('borrows').findOne({
            _id: new ObjectId(borrowId),
            userEmail: DEMO_USER_EMAIL
        });

        if (!borrow) {
            return res.status(404).send({
                success: false,
                message: 'Borrow record not found.'
            });
        }

        if (borrow.returned) {
            return res.status(400).send({
                success: false,
                message: 'This book has already been returned.'
            });
        }

        // Mark the book as returned
        const result = await db.collection('borrows').updateOne(
            {
                _id: new ObjectId(borrowId),
                returned: { $ne: true }
            },
            {
                $set: {
                    returned: true,
                    actualReturnDate: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).send({
                success: false,
                message: 'This book has already been returned.'
            });
        }

        // Increase available copies
        await db.collection('books').updateOne(
            { _id: borrow.bookId },
            {
                $inc: { availableCopies: 1 }
            }
        );

        res.status(200).send({
            success: true,
            message: 'Book returned successfully!'
        });

    } catch (error) {
        console.log('Return book error:', error);

        res.status(500).send({
            success: false,
            message: 'Failed to return book.'
        });
    }
});


export default router;
