import express from "express";
import Stripe from "stripe";
import admin from "firebase-admin";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// parse JSON
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY))
    });
}

// ===== POST /api/create-checkout-session =====
app.post("/api/create-checkout-session", async (req, res) => {
    const { uid, email } = req.body;

    if (!uid || !email) return res.status(400).json({ error: "Missing uid or email" });

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            customer_email: email,
            line_items: [
                { price: "price_1Szb31GqBhYoGeXbRsNVfAXQ", quantity: 1 }
            ],
            success_url: "http://localhost:5500/success.html",
            cancel_url: "http://localhost:5500/cancel.html",
            metadata: { firebaseUID: uid }
        });

        res.status(200).json({ id: session.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ===== Stripe webhook to mark user as pro =====
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const uid = session.metadata.firebaseUID;

        await admin.firestore().collection("users").doc(uid).update({ pro: true });
        console.log(`User ${uid} upgraded to Pro`);
    }

    res.status(200).json({ received: true });
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
