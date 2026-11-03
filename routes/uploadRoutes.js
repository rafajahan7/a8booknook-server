
import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({
                success: false,
                message: 'Please select an image.'
            });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).send({
                success: false,
                message: 'Only image files are allowed.'
            });
        }

        const formData = new FormData();

        formData.append(
            'image',
            req.file.buffer.toString('base64')
        );

        const response = await axios.post(
            'https://api.imgbb.com/1/upload',
            formData,
            {
                params: {
                    key: process.env.IMGBB_API_KEY
                },
                headers: formData.getHeaders()
            }
        );

        res.status(200).send({
            success: true,
            message: 'Image uploaded successfully!',
            imageUrl: response.data.data.url
        });

    } catch (error) {
        console.log('Upload error:', error.response?.data || error.message);

        res.status(500).send({
            success: false,
            message: 'Image upload failed.'
        });
    }
});

export default router;
