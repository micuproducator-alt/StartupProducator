// @ts-nocheck
import axios from "axios";

interface PaymentEmailParams {
  toEmail: string;
  adTitle: string;
  amount: number;
  editUrl: string;
}

/**
 * Trimitem email-ul direct prin API-ul Brevo (REST)
 * Design actualizat pentru Micul Producător
 */
export const sendPaymentConfirmation = async (
  params: PaymentEmailParams,
  retries = 3,
) => {
  const { toEmail, adTitle, amount, editUrl } = params;

  // REPARARE URL: Ne asigurăm că link-ul folosește ruta corectă cu Hash Router (/#/ad/)
  let finalUrl = editUrl;
  if (finalUrl.includes("/anunt/")) {
    finalUrl = finalUrl.replace("/anunt/", "/#/ad/");
  } else if (finalUrl.includes("/ad/") && !finalUrl.includes("#")) {
    finalUrl = finalUrl.replace("/ad/", "/#/ad/");
  }

  const data = {
    sender: {
      name: process.env.OFFICIAL_NAME || "Micul Producător",
      email: process.env.OFFICIAL_EMAIL || "contact@miculproducator.ro",
    },
    to: [{ email: toEmail }],
    subject: `Confirmare Publicare Anunț: ${adTitle}`,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333; line-height: 1.6; border: 1px solid #eee; border-radius: 12px;">
        <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #10b981; margin: 0; font-size: 24px;">Micul Producător</h1>
          <p style="font-style: italic; color: #666; margin: 5px 0 0 0;">Împreună pentru o Românie mai bună</p>
        </div>

        <div style="padding: 10px 0;">
          <p style="font-size: 16px;">Bună ziua,</p>
          
          <p>Vă informăm că anunțul dumneavoastră <strong>"${adTitle}"</strong> a fost publicat cu succes.</p>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #b45309;">⚠️ Atenție la Regulament:</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #444;">
              Vă rugăm să citiți regulamentul site-ului. Dacă anunțul nu este conform regulilor, acesta va fi șters <strong>fără returnarea banilor</strong>.
            </p>
          </div>

          <p><strong>Detalii tranzacție:</strong><br>
          Suma achitată: <span style="font-weight: bold;">${amount} RON</span></p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${finalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Verifică Anunțul</a>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <div style="font-size: 15px;">
          <p style="margin: 0;">Mulțumim,</p>
          <p style="margin: 0; font-weight: bold; color: #10b981;">Echipa Micul Producător</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
          <p>© ${new Date().getFullYear()} Micul Producător. Toate drepturile rezervate.</p>
        </div>
      </div>
    `,
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        data,
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
          },
        },
      );

      console.log(`✅ Email trimis cu succes (ID: ${response.data.messageId})`);
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`❌ Tentativa ${i + 1} eșuată:`, errorMsg);

      if (i === retries - 1) throw new Error(errorMsg);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
};
