import express, { Request, Response } from "express";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const router = express.Router();

// Definim prețurile pe server pentru siguranță
const PLAN_PRICES: Record<string, number> = {
  basic: 0,
  standard: 15, // 15 RON
  premium: 35, // 35 RON
};

// Am scos "/payment" din path pentru că e deja pus în index.ts
router.post("/create-session", async (req: Request, res: Response) => {
  const { adId, planName, email } = req.body;

  try {
    // Calculăm prețul aici, nu îl luăm din frontend (pentru a evita hack-urile)
    const amount = PLAN_PRICES[planName as string] || 0;

    // Dacă e plan gratuit, trimitem direct la succes
    if (amount === 0) {
      return res.json({
        url: `${process.env.FRONTEND_URL}/success?adId=${adId}`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Pachet ${planName.toUpperCase()}`,
              description: `Promovare anunț Micul Producător #${adId}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe vrea bani/cenți
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?adId=${adId}`,
      cancel_url: `${process.env.FRONTEND_URL}/create-ad`,
      metadata: {
        adId: String(adId), // Foarte important pentru Webhook!
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
