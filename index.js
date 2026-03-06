require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || GMAIL_USER;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
});

// API Endpoint to send email
app.post('/api/notify', async (req, res) => {
    const { email, title, url, price } = req.body;

    const mailOptions = {
        from: `"PromoZone Bot" <${GMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: `🚀 New Submission: ${title}`,
        html: `
            <div style="font-family: sans-serif; border: 1px solid #4f46e5; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4f46e5;">New Reel Received</h2>
                <p><strong>User:</strong> ${email}</p>
                <p><strong>Campaign:</strong> ${title}</p>
                <p><strong>Reel URL:</strong> <a href="${url}">${url}</a></p>
                <p><strong>Rate:</strong> ₹${price} / 1M Views</p>
            </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));

