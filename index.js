const express = require('express');
require('dotenv').config();
const firebase = require('firebase/compat/app');
require('firebase/compat/database');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAb7V8Xxg5rUYi8UKChEd3rR5dglJ6bLhU",
    authDomain: "t2-storage-4e5ca.firebaseapp.com",
    databaseURL: "https://t2-storage-4e5ca-default-rtdb.firebaseio.com",
    projectId: "t2-storage-4e5ca"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// --- 2. MAIL CONFIG (Environment Variables use karein) ---
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tinu.alerts@gmail.com'; 
const GMAIL_USER = process.env.GMAIL_USER || 'tinu.alerts@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS; // Render Dashboard me config karein

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
    }
});

// --- 3. BACKGROUND LISTENER ---
db.ref('users').on('value', (snapshot) => {
    const allUsers = snapshot.val();
    if (!allUsers) return;

    for (let userId in allUsers) {
        const userData = allUsers[userId];
        if (userData.reels) {
            for (let reelId in userData.reels) {
                const reel = userData.reels[reelId];
                if (reel.status === 'Pending' && !reel.adminNotified) {
                    console.log(`Sending email for: ${reel.url}`);
                    sendMail(userData.email || 'No Email', reel, userId, reelId);
                }
            }
        }
    }
});

async function sendMail(userEmail, reelData, userId, reelId) {
    const mailOptions = {
        from: `"PromoZone Admin" <${GMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: `New Reel: ${reelData.campaignTitle}`,
        html: `<h3>New Submission</h3>
               <p><b>User:</b> ${userEmail}</p>
               <p><b>Link:</b> <a href="${reelData.url}">${reelData.url}</a></p>
               <p><b>Rate:</b> ₹${reelData.ratePerMillion}</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        // Mail bhejte hi flag update karein taki loop na bane
        await db.ref(`users/${userId}/reels/${reelId}`).update({ adminNotified: true });
        console.log("✅ Email sent & DB updated");
    } catch (e) {
        console.error("❌ Mail Error:", e.message);
    }
}

// Admin Panel Route
app.get('/admin', (req, res) => {
    // ... (Wahi admin panel wala HTML jo pehle diya tha)
    res.send('Admin Panel Running - Data will show here.'); 
});

// Main Route for Render Health Check
app.get('/', (req, res) => res.send("PromoZone Monitor is Live!"));

// --- RENDER PORT BINDING ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

