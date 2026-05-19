import express, { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma";
import { sendPaymentConfirmation } from "../services/emailService"; // Importă serviciul creat

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const router = express.Router();

// IMPORTANT: Webhook-ul are nevoie de body în format RAW pentru a verifica semnătura Stripe
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || "",
      );
    } catch (err: any) {
      console.error(`❌ Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestionăm evenimentul de plată reușită
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const adId = session.metadata?.adId;

      if (adId) {
        try {
          // 1. Update în baza de date
          const updatedAd = await prisma.ads.update({
            where: { id: adId },
            data: { status: "active" },
          });

          console.log(`✅ Plata confirmată pentru Ad: ${adId}`);

          // 2. Trimitem email-ul de confirmare
          // Folosim datele din sesiune și din Ad-ul proaspăt actualizat
          await sendPaymentConfirmation({
            toEmail: session.customer_details?.email || updatedAd.email,
            adTitle: updatedAd.title,
            amount: session.amount_total ? session.amount_total / 100 : 0, // Convertim din bani/cenți în RON
            editUrl: `${process.env.FRONTEND_URL}/edit-ad/${updatedAd.token_hash}`,
          });
        } catch (dbError: any) {
          console.error(
            "❌ Eroare activare/email în Webhook:",
            dbError.message,
          );
          // Nu returnăm eroare 400 aici, pentru ca Stripe să nu tot reincerce cererea dacă e o eroare de email
        }
      }
    }

    res.json({ received: true });
  },
);

export default router;
