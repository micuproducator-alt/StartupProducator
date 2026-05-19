import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";

const router = express.Router();

router.post("/ads", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      email,
      phone_number,
      county,
      city,
      categoryId,
      images,
      // durationDays, <-- Putem să-l ignorăm pe acesta din frontend pentru siguranță
    } = req.body;

    const safeImages = Array.isArray(images) ? images : [];
    const editToken = randomUUID();

    // --- AJUSTARE DE NOTA 10: Calculăm data fixă de 30 de zile ---
    // Indiferent ce zice frontend-ul, noi setăm expirarea la 30 de zile de acum
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const newAd = await prisma.ads.create({
      data: {
        title: String(title),
        description: String(description),
        price: new Prisma.Decimal(price || 0),
        email: String(email),
        phone_number: String(phone_number),
        county: String(county),
        city: String(city),
        token_hash: editToken, // Acesta este cheia de acces pentru user
        expires_at: expiresAt,
        status: "pending",

        // ... logica pentru categorii și imagini rămâne la fel ...
        // (codul tău actual este foarte bun aici)
      },
      include: {
        ads_images: true,
        ads_categories: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: newAd.id,
        editToken: editToken, // Îl trimitem la frontend ca să-l poată folosi în URL-ul de plată
        email: newAd.email,
      },
    });
  } catch (err: any) {
    console.error("❌ Eroare la crearea anunțului (ads.ts):", err);

    // Returnăm eroare 400 fără să omorâm serverul
    res.status(400).json({
      success: false,
      message: "Nu s-a putut crea anunțul.",
      errors: [err.message],
    });
  }
});

export default router;
