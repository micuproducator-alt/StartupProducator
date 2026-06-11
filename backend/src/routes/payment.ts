import express from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

// 1. Tabelul de prețuri actualizat (trebuie să fie identic cu cel din index.ts)
const PRICING_TABLE: Record<string, Record<number, number>> = {
  basic: { 30: 10, 90: 27, 180: 54, 360: 96 },
  standard: { 30: 20, 90: 57, 180: 108, 360: 204 },
  premium: { 30: 30, 90: 84, 180: 162, 360: 300 },
};

router.post("/create-session", async (req, res) => {
  try {
    // Luăm plan_type și duration (trimise de noul handlePayment din Frontend)
    const { adId, plan_type, duration, email } = req.body;

    // VERIFICARE: Acum verificăm câmpurile corecte
    if (!adId || !plan_type || !duration) {
      console.error("❌ Lipsesc date:", { adId, plan_type, duration });
      return res.status(400).json({ error: "Date insuficiente pentru plată." });
    }

    // 1. Verificăm anunțul în DB
    const ad = await prisma.ads.findUnique({
      where: { id: String(adId) },
    });

    if (!ad) {
      return res.status(404).json({ error: "Anunțul nu a fost găsit." });
    }

    // 2. Calculăm prețul DINAMIC (Security Check)
    // Folosim datele din DB (ad.plan_type) sau cele primite, pentru siguranță
    const selectedPlan = plan_type || ad.plan_type;
    const selectedDuration = Number(duration);

    const priceInRon = PRICING_TABLE[selectedPlan]?.[selectedDuration] || 15;

    // 3. Creăm sesiunea de Stripe
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
            unit_amount: Math.round(priceInRon * 100), // Transformăm RON în bani/cenți
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
      // URL-urile corectate care te trimit pe prima pagina curata din Vercel
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
