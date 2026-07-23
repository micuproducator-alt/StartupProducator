import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/sitemap.xml", async (req: Request, res: Response) => {
  try {
    // Luăm din baza de date doar anunțurile active
    const activeAds = await prisma.ads.findMany({
      where: {
        status: "active",
      },
      select: {
        id: true,
        slug: true,
        created_at: true,
      },
    });

    // Generează URL-urile dinamice pentru fiecare anunț
    const dynamicUrls = activeAds
      .map((ad) => {
        // Folosește slug-ul dacă există, altfel fallback pe ID
        const urlPath = ad.slug ? ad.slug : ad.id;
        const dateFormatted = new Date(ad.created_at)
          .toISOString()
          .split("T")[0];

        return `
  <url>
    <loc>https://www.locallio.ro/anunt/${urlPath}</loc>
    <lastmod>${dateFormatted}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join("");

    // Asamblează fișierul XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.locallio.ro/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${dynamicUrls}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Eroare la generarea sitemap-ului:", error);
    res.status(500).end();
  }
});

export default router;
