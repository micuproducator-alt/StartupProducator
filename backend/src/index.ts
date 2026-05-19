import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import prisma from "./lib/prisma.js";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { CreateAdSchema, UpdateAdSchema } from "./schemas/ad.schema.js";
import Stripe from "stripe";
import paymentRouter from "./routes/payment.js";
import { sendPaymentConfirmation } from "./services/emailService";
import { initCronJobs } from "./services/cronServices";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "", // Pune cheia în .env sau lasă gol
  tracesSampleRate: 0.1,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const app = express();
const PORT = process.env.PORT || 3000;
let cachedCounties: any = null;
let cachedLocations: Record<number, any> = {};
let cachedCategories: any = null;

const PRICING_TABLE: Record<string, Record<number, number>> = {
  basic: { 30: 10, 90: 27, 180: 54, 360: 96 },
  standard: { 30: 20, 90: 57, 180: 108, 360: 204 },
  premium: { 30: 30, 90: 84, 180: 162, 360: 300 },
};

// --- 1. CONFIGURĂRI DE SECURITATE ---
// --- 1. CONFIGURĂRI DE SECURITATE ---
// Dezactivăm parțial regulile Helmet care se bat cap în cap cu CORS și scripturile externe (cum e cel de la Tailwind)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // Permite încarcarea scripturilor externe gen cdn.tailwindcss.com
  }),
);

// Permitem conexiuni din ambele medii (Local și Vercel)
const allowedOrigins = [
  "http://localhost:5173",
  "https://startup-producator-2vuac5o6u-miculproducator.vercel.app",
  "https://startup-producator.vercel.app", // Pune și varianta scurtă dacă o ai
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite cereri fără origine (cum sunt cele de pe server-to-server sau Postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Blocat de CORS: Originea nu este permisă!"));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// --- 2. WEBHOOK STRIPE ---
app.post(
  ["/api/webhook", "/webhook"],
  bodyParser.raw({ type: "application/json" }),
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
      console.error("❌ Webhook Signature Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const adId = session.metadata?.adId;
      const categoryId = session.metadata?.categoryId;
      const userEmail = session.customer_details?.email;

      if (adId) {
        try {
          const planType = session.metadata?.planType;
          const duration = Number(session.metadata?.duration || 30);
          const newExpiresAt = new Date();
          newExpiresAt.setDate(newExpiresAt.getDate() + duration);

          const updatedAd = await prisma.ads.update({
            where: { id: String(adId) },
            data: {
              status: "active",
              is_premium: planType === "premium",
              expires_at: newExpiresAt,
            },
          });

          if (categoryId) {
            await prisma.ads_categories.upsert({
              where: {
                ad_id_category_id: {
                  ad_id: String(adId),
                  category_id: Number(categoryId),
                },
              },
              update: {},
              create: {
                ad_id: String(adId),
                category_id: Number(categoryId),
              },
            });
          }

          if (userEmail) {
            await sendPaymentConfirmation({
              toEmail: userEmail,
              adTitle: updatedAd.title,
              amount: session.amount_total! / 100,
              editUrl: `${process.env.FRONTEND_URL}/anunt/${updatedAd.slug}`,
            });
          }
        } catch (error) {
          console.error("❌ Eroare Webhook Logic:", error);
        }
      }
    }
    res.json({ received: true });
  },
);

// --- 3. PARSERS & RATE LIMIT ---
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/payment", paymentRouter);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  message: { error: "Prea multe cereri." },
});
app.use("/api/", limiter);

// --- 4. RUTE GEOGRAFIE (NOU - PRODUCTION READY) ---

// Obține toate județele
app.get("/api/geo/counties", async (_req, res, next) => {
  try {
    if (cachedCounties) return res.json(cachedCounties); // Returnăm din RAM
    const counties = await prisma.counties.findMany({
      orderBy: { name: "asc" },
    });
    cachedCounties = counties;
    res.json(counties);
  } catch (error) {
    next(error);
  }
});

// Obține localitățile dintr-un județ
app.get("/api/geo/locations/:countyCode", async (req, res, next) => {
  try {
    const countyCode = parseInt(req.params.countyCode);
    if (cachedLocations[countyCode])
      return res.json(cachedLocations[countyCode]); // Returnăm din RAM

    const locations = await prisma.locations.findMany({
      where: { county_code: countyCode },
      orderBy: { name: "asc" },
    });
    cachedLocations[countyCode] = locations;
    res.json(locations);
  } catch (error) {
    next(error);
  }
});

// --- 5. RUTE CATEGORII & ANUNȚURI ---

app.get("/api/categories", async (_req, res, next) => {
  try {
    if (cachedCategories) return res.json(cachedCategories);
    const categories = await prisma.categories.findMany({
      orderBy: { id: "asc" },
    });
    cachedCategories = categories;
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.get("/api/ads", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    // Filtre opționale: județ și oraș
    const { county, city } = req.query;

    const whereClause: any = { status: "active" };
    if (county) whereClause.county = String(county);
    if (city) whereClause.city = String(city);

    const ads = await prisma.ads.findMany({
      where: whereClause,
      include: {
        ads_images: { orderBy: { position: "asc" } },
        ads_categories: { include: { categories: true } },
      },
      orderBy: [{ is_premium: "desc" }, { created_at: "desc" }],
      skip: skip,
      take: limit,
    });

    const totalAds = await prisma.ads.count({ where: whereClause });

    res.json({
      data: ads,
      pagination: {
        total: totalAds,
        pages: Math.ceil(totalAds / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/ads/:identifier",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.params.identifier as string;
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          identifier,
        );

      const ad = await (prisma.ads.findFirst as any)({
        where: {
          OR: [
            isUuid ? { id: identifier } : undefined,
            { slug: identifier },
          ].filter(Boolean),
        },
        include: {
          ads_images: { orderBy: { position: "asc" } },
          ads_categories: { include: { categories: true } },
          ads_reviews: { orderBy: { created_at: "desc" } },
        },
      });

      if (!ad)
        return res
          .status(404)
          .json({ success: false, message: "Anunțul nu a fost găsit." });
      res.json(ad);
    } catch (error) {
      next(error);
    }
  },
);

app.post(
  "/api/ads",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = CreateAdSchema.parse(req.body);
      const plan = (req.body.plan_type || "starter")
        .toLowerCase()
        .replace(" ", "_");
      const duration = Number(req.body.duration) || 30;
      const priceInRon = PRICING_TABLE[plan]?.[duration] || 10;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);

      const manageToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(manageToken)
        .digest("hex");

      const newAd = await (prisma.ads.create as any)({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          price: new Prisma.Decimal(validatedData.price),
          email: validatedData.email,
          phone_number: validatedData.phone_number,
          county: validatedData.county,
          city: validatedData.city,
          token_hash: tokenHash,
          status: "pending",
          plan_type: plan,
          expires_at: expiresAt,
          slug: req.body.slug,
        },
      });

      await prisma.ads_categories.create({
        data: {
          ad_id: newAd.id,
          category_id: Number(validatedData.categoryId),
        },
      });

      if (validatedData.images && validatedData.images.length > 0) {
        await Promise.all(
          validatedData.images.map((url: string, index: number) =>
            prisma.ads_images.create({
              data: { ad_id: newAd.id, url, position: index },
            }),
          ),
        );
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: validatedData.email,
        line_items: [
          {
            price_data: {
              currency: "ron",
              product_data: {
                name: `Anunț ${plan.toUpperCase()} - ${duration} zile`,
                description: `Publicare pe Micul Producător: ${validatedData.title}`,
              },
              unit_amount: priceInRon * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          adId: newAd.id,
          categoryId: validatedData.categoryId.toString(),
          planType: plan,
          duration: String(duration),
        },
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      });

      res
        .status(201)
        .json({ success: true, url: session.url, adId: newAd.id, manageToken });
    } catch (error: any) {
      next(error);
    }
  },
);

// --- 6. REVIEWS, PATCH, DELETE ---

app.post("/api/ads/:id/reviews", async (req, res) => {
  try {
    const review = await (prisma as any).ads_reviews.create({
      data: {
        ad_id: String(req.params.id),
        author: req.body.author_name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      },
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: "Eroare la adăugarea review-ului" });
  }
});

app.patch(
  "/api/ads/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const { manageToken, ...updateData } = req.body;
      const inputHash = crypto
        .createHash("sha256")
        .update(manageToken || "")
        .digest("hex");

      const ad = await prisma.ads.findUnique({ where: { id } });
      if (!ad || ad.token_hash !== inputHash)
        return res
          .status(403)
          .json({ success: false, message: "Token invalid" });

      const validatedData = UpdateAdSchema.parse(updateData);
      const updatedAd = await prisma.ads.update({
        where: { id },
        data: {
          ...validatedData,
          ...(validatedData.price && {
            price: new Prisma.Decimal(validatedData.price),
          }),
        },
      });
      res.json({ success: true, data: updatedAd });
    } catch (error) {
      next(error);
    }
  },
);

app.delete(
  "/api/ads/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const { manageToken } = req.body;
      const inputHash = crypto
        .createHash("sha256")
        .update(manageToken || "")
        .digest("hex");

      const ad = await prisma.ads.findUnique({ where: { id } });
      if (!ad || ad.token_hash !== inputHash)
        return res
          .status(403)
          .json({ success: false, message: "Token invalid" });

      await prisma.ads.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

// --- 7. ERROR HANDLER & START ---

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("🔥 Global Error:", err.stack); // stack-ul e mai util decât message
  res.status(err.status || 500).json({
    success: false,
    message: "A apărut o eroare internă.",
    // Nu trimite err.message direct în producție din motive de securitate
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server pe portul ${PORT}`);
  initCronJobs();
});

// Închidem conexiunea cu baza de date curat când serverul se oprește
process.on("SIGTERM", async () => {
  console.log("SIGTERM primit. Închidem conexiunile la DB...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT primit (Ctrl+C). Închidem conexiunile...");
  await prisma.$disconnect();
  process.exit(0);
});
