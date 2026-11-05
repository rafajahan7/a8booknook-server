
import express from 'express';
import { db } from '../index.js';
import { ObjectId } from 'mongodb';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();


// Borrow a book (Protected)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { bookId } = req.body;
        const userEmail = req.user.email;

        if (!userEmail) {
            return res.status(401).send({
                success: false,
                message: 'User information not found.'
            });
        }

        if (!bookId || !ObjectId.isValid(bookId)) {
            return res.status(400).send({
                success: false,
                message: 'Valid book ID is required.'
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

        // Check whether the user has already borrowed this book
        const existingBorrow = await db.collection('borrows').findOne({
            bookId: new ObjectId(bookId),
            userEmail: userEmail,
            returned: false
        });

        if (existingBorrow) {
            return res.status(400).send({
                success: false,
                message: 'You have already borrowed this book. Please return it first.'
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
            userEmail: userEmail,
            borrowDate: borrowDate,
            returnDate: returnDate,
            returned: false
        };

        // Save borrowing information
        try {
            await db.collection('borrows').insertOne(borrowData);
        } catch (error) {
            // Restore the copy if saving fails
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


// Get borrowed books of the logged-in user (Protected)
router.get('/', verifyToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        if (!userEmail) {
            return res.status(401).send({
                success: false,
                message: 'User information not found.'
            });
        }

        const borrows = await db.collection('borrows')
            .find({ userEmail: userEmail })
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


// Return a borrowed book (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const borrowId = req.params.id;
        const userEmail = req.user.email;

        if (!userEmail) {
            return res.status(401).send({
                success: false,
                message: 'User information not found.'
            });
        }

        if (!ObjectId.isValid(borrowId)) {
            return res.status(400).send({
                success: false,
                message: 'Invalid borrow ID.'
            });
        }

        // Mark as returned only if not already returned
        const result = await db.collection('borrows').updateOne(
            {
                _id: new ObjectId(borrowId),
                userEmail: userEmail,
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
            return res.status(404).send({
                success: false,
                message: 'Borrow record not found or book already returned.'
            });
        }

        // Get the borrow record to find the book ID
        const borrow = await db.collection('borrows').findOne({
            _id: new ObjectId(borrowId),
            userEmail: userEmail
        });

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
