const express = require('express');
const firebase = require('firebase/compat/app'); // 'compat' add kiya
require('firebase/compat/database');           // 'compat' add kiya
const nodemailer = require('nodemailer');

const app = express();

// --- 1. AAPKA FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAb7V8Xxg5rUYi8UKChEd3rR5dglJ6bLhU",
    authDomain: "t2-storage-4e5ca.firebaseapp.com",
    databaseURL: "https://t2-storage-4e5ca-default-rtdb.firebaseio.com",
    projectId: "t2-storage-4e5ca"
};

// Firebase Initialize (Compat mode)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// --- 2. MAIL CONFIGURATION ---
const ADMIN_EMAIL = 'tomeshmourya408@gmail.com'; // Apna email yaha dalein
const GMAIL_USER = 'tinumourya0@gmail.com';  // Apna email yaha dalein
const GMAIL_PASS = 'aztg klva bidf hwyl';      // 16-digit App Password (no spaces)

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
});

// Transporter Check
transporter.verify((error) => {
    if (error) console.log("❌ Mail Error: ", error);
    else console.log("✅ Mail Server Ready");
});

// --- 3. REALTIME LISTENER ---
console.log("👀 Monitoring Firebase for new reels...");

db.ref('users').on('value', (snapshot) => {
    const allUsers = snapshot.val();
    if (!allUsers) return;

    for (let userId in allUsers) {
        const userData = allUsers[userId];
        if (userData.reels) {
            for (let reelId in userData.reels) {
                const reel = userData.reels[reelId];

                // Check: Pending status aur pehle notify na hua ho
                if (reel.status === 'Pending' && !reel.adminNotified) {
                    
                    console.log(`🚀 New Reel from ${userData.email || userId}! Sending mail...`);
                    
                    sendMail(userData.email || 'No Email', reel);

                    // Flag update karein taaki loop baar-baar mail na bheje
                    db.ref(`users/${userId}/reels/${reelId}`).update({
                        adminNotified: true
                    });
                }
            }
        }
    }
});

async function sendMail(userEmail, reelData) {
    const mailOptions = {
        from: `"PromoZone Bot" <${GMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: `New Reel: ${reelData.campaignTitle}`,
        html: `
            <div style="font-family: sans-serif; border: 1px solid #4f46e5; padding: 20px;">
                <h2 style="color: #4f46e5;">New Submission</h2>
                <p><strong>User:</strong> ${userEmail}</p>
                <p><strong>Campaign:</strong> ${reelData.campaignTitle}</p>
                <p><strong>Reel URL:</strong> <a href="${reelData.url}">${reelData.url}</a></p>
                <p><strong>Rate:</strong> ₹${reelData.ratePerMillion}</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent!");
    } catch (error) {
        console.error("❌ Email failed:", error);
    }
}

const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

