import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { uid, email } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: "price_1Szb31GqBhYoGeXbRsNVfAXQ", 
          quantity: 1,
        },
      ],
      success_url: "https://kwik-task.vercel.app/success",
      cancel_url: "https://kwik-task.vercel.app/index.html",
      metadata: { firebaseUID: uid },
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}
