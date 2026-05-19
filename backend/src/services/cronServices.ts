import cron from "node-cron";
import prisma from "../lib/prisma.js";

export const initCronJobs = () => {
  // Rulează zilnic la miezul nopții (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("🧹 Verificare anunțuri expirate...");
    try {
      const now = new Date();

      const result = await prisma.ads.updateMany({
        where: {
          status: "active",
          expires_at: {
            lt: now, // Mai mic decât ora curentă
          },
        },
        data: {
          status: "expired",
        },
      });

      if (result.count > 0) {
        console.log(`✅ Au fost expirate ${result.count} anunțuri.`);
      }
    } catch (error) {
      console.error("❌ Eroare la rularea Cron Job-ului:", error);
    }
  });
};
