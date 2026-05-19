import { supabase } from "../lib/supabase";
import { Ad } from "../types";
import { generateSlug } from "@/utils/slug";

const CATEGORY_MAP: Record<string, number> = {
  Legume: 1,
  Fructe: 2,
  "Lactate & Brânzeturi": 3,
  "Carne & Mezeluri": 4,
  "Miere & Apicole": 5,
  Ouă: 6,
  "Torturi & Prăjituri": 7,
  "Dulceață & Zacuști": 8,
  "Băuturi & Siropuri": 9,
  "Făinoase & Patiserie": 10,
  "Artizanat & Lucru Manual": 11,
  "Flori & Plante": 12,
  Altele: 13,
};
// 1. HELPER DE MAPARE (O singură dată definit)
const mapAdData = (ad: any): Ad => {
  // Logica de imagini: Schema Prisma zice că tabelul e ads_images și are coloana url
  const rawImages = ad.ads_images || [];

  const processedImages = rawImages
    .map((img: any) => {
      // Dacă img e deja string, îl lăsăm așa. Dacă e obiect, luăm .url
      const url = typeof img === "string" ? img : img.url;
      return {
        url: url || "",
        position: img.position || 0,
      };
    })
    .sort((a: any, b: any) => a.position - b.position);

  return {
    ...ad,
    ads_images: processedImages,
    // Ne asigurăm că restul câmpurilor rămân intacte
    ads_reviews: ad.ads_reviews || [],
    rating: Number(ad.rating) || 0,
    reviewCount: ad.reviews_count || 0,
  };
};

// 2. FETCH TOATE ANUNTURILE
export const fetchActiveAds = async (): Promise<Ad[]> => {
  const { data, error } = await supabase
    .from("ads")
    .select(
      `
      *,
      ads_categories (categories (name)),
      ads_images (url)
    `,
    ) // Am scos ads_reviews de aici pentru a evita eroarea PGRST201
    .eq("status", "active")
    .order("is_premium", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Dacă ai nevoie de rating pe carduri, mapAdData va pune 0/gol
  // sau poți face un fetch separat pentru medii dacă e critic.
  return (data || []).map(mapAdData);
};
// 3. FETCH UN SINGUR ANUNT (ID sau SLUG)
// Găsește această funcție în adsService.ts și înlocuiește-o cu totul:

export const fetchAdById = async (id: string | undefined): Promise<Ad> => {
  if (!id) throw new Error("ID lipsă");

  // 1. Fetch date de bază + Relații
  // NOTĂ: Folosim exact numele din modelul Prisma (ads_images, ads_categories)
  const { data: adData, error: adError } = await supabase
    .from("ads")
    .select(
      `
      *,
      ads_images (
        id,
        url,
        position
      ),
      ads_categories (
        categories (
          id,
          name
        )
      )
    `,
    )
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();
  console.log("LOG IMAGINI RAW:", adData?.ads_images);

  if (adError) {
    console.error("Eroare Supabase la Ad:", adError);
    throw adError;
  }

  // 2. Fetch recenzii separat (ca să evităm eroarea de adâncime/nesting)
  const { data: reviewsData, error: reviewsError } = await supabase
    .from("ads_reviews")
    .select("*")
    .eq("ad_id", adData.id)
    .order("created_at", { ascending: false });

  if (reviewsError) console.error("Eroare la Recenzii:", reviewsError);

  // 3. Combinăm manual înainte de mapare
  const combinedData = {
    ...adData,
    ads_reviews: reviewsData || [],
  };

  return mapAdData(combinedData);
};
// 4. PRODUSE SIMILARE
export const fetchRelatedAds = async (
  categoryNames: string[],
  currentAdId: string,
): Promise<Ad[]> => {
  if (!categoryNames.length) return [];
  const { data, error } = await supabase
    .from("ads")
    .select(
      `*, ads_categories!inner (categories!inner (name)), ads_images (url), ads_reviews (*)`,
    )
    .eq("status", "active")
    .neq("id", currentAdId)
    .in("ads_categories.categories.name", categoryNames)
    .limit(3);

  if (error) return [];
  return (data || []).map(mapAdData);
};

// 5. ADAUGARE REVIEW
export const addReview = async (
  adId: string,
  review: { author_name: string; rating: number; comment: string },
) => {
  let userIp = "unknown";
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const ipData = await response.json();
    userIp = ipData.ip;
  } catch (e) {}

  const { data, error } = await supabase
    .from("ads_reviews")
    .insert([
      {
        ad_id: adId,
        author: review.author_name,
        rating: review.rating,
        comment: review.comment,
        user_ip: userIp,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Ai lăsat deja o recenzie.");
    throw error;
  }
  return data;
};

// 6. UPLOAD IMAGINE
export const uploadAdImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const { error } = await supabase.storage
    .from("ad-images")
    .upload(fileName, file);
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from("ad-images").getPublicUrl(fileName);
  return publicUrl;
};

// 7. CREARE ANUNT COMPLET
export const createFullAd = async (adData: any, imageUrls: string[]) => {
  console.log("DATE PRIMITE DIN FORMULAR:", adData);
  const token = crypto.randomUUID();
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + (adData.duration || 30));

  const { data: ad, error: adError } = await supabase
    .from("ads")
    .insert([
      {
        title: adData.title,
        description: adData.description,
        price: adData.price,
        email: adData.email,
        phone_number: adData.phoneNumber || adData.phone_number,
        county: adData.location?.county || adData.county,
        city: adData.location?.city || adData.city,
        token_hash: token,
        plan_type: adData.plan_type || "basic",
        status: "pending",
        expires_at: expirationDate.toISOString(),
        slug:
          adData.slug ||
          `${generateSlug(adData.title)}-${Math.random().toString(36).substring(7)}`,
        is_premium: adData.plan_type === "premium",
      },
    ])
    .select()
    .single();

  if (adError) throw adError;

  if (imageUrls.length > 0) {
    const imagesData = imageUrls.map((url, index) => ({
      ad_id: ad.id,
      url,
      position: index,
    }));
    await supabase.from("ads_images").insert(imagesData);
  }

  if (adData.categories?.length > 0) {
    const categoriesData = adData.categories
      .map((catName: string) => ({
        ad_id: ad.id,
        category_id: CATEGORY_MAP[catName],
      }))
      .filter((item: any) => item.category_id !== undefined);
    if (categoriesData.length > 0)
      await supabase.from("ads_categories").insert(categoriesData);
  }
  return ad;
};
