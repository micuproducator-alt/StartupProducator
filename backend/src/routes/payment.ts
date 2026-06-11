import express from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// 1. Tabelul de prețuri actualizat
const PRICING_TABLE: Record<string, Record<number, number>> = {
  // ⚡️ MODIFICAT AICI: 30 de zile la Basic este acum 0 RON (Gratis!)
  basic: { 30: 0, 90: 27, 180: 54, 360: 96 },
  standard: { 30: 20, 90: 57, 180: 108, 360: 204 },
  premium: { 30: 30, 90: 84, 180: 162, 360: 300 },
};

router.post("/create-session", async (req, res) => {
  try {
    const { adId, plan_type, duration, email } = req.body;

    if (!adId || !plan_type || !duration) {
      console.error("❌ Lipsesc date:", { adId, plan_type, duration });
      return res.status(400).json({ error: "Date insuficiente pentru plată." });
    }

    const ad = await prisma.ads.findUnique({
      where: { id: String(adId) },
    });

    if (!ad) {
      return res.status(404).json({ error: "Anunțul nu a fost găsit." });
    }

    const selectedPlan = plan_type || ad.plan_type;
    const selectedDuration = Number(duration);

    const priceInRon = PRICING_TABLE[selectedPlan]?.[selectedDuration] || 15;

    // ⚡️ ȘMECHERIA PENTRU ANUNȚUL GRATUIT:
    // Dacă prețul este 0 (adică Basic de 30 de zile), trimitem userul direct la succes!
    if (priceInRon === 0) {
      console.log(
        `🎁 Plan gratuit detectat (Basic 30 zile) pentru Ad: ${adId}. Redirecționare directă.`,
      );
      const successUrl = `${process.env.FRONTEND_URL?.replace(/\/$/, "")}/?payment=success`;
      return res.json({ url: successUrl });
    }

    // 3. Creăm sesiunea de Stripe (Aici se ajunge DOAR dacă prețul e mai mare de 0)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: ad.email || email,
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Pachet ${selectedPlan.toUpperCase()} - ${selectedDuration} zile`,
              description: `Activare anunț: ${ad.title}`,
            },
            unit_amount: Math.round(priceInRon * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        adId: String(adId),
        planType: selectedPlan,
        duration: String(selectedDuration),
      },
      success_url: `${process.env.FRONTEND_URL?.replace(/\/$/, "")}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL?.replace(/\/$/, "")}/?payment=cancel`,
    });

    console.log(`✅ Stripe Session: ${priceInRon} RON pentru Ad: ${adId}`);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error("❌ Stripe Session Error:", error);
    res.status(500).json({ error: "Eroare la procesarea plății." });
  }
});

export default router;
