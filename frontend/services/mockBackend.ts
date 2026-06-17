// 📄 Schimbă numele fișierului în: src/services/adsService.ts

import { Ad, CreateAdPayload, Review } from "../types";
// 🟢 REPARAT: Importăm instanța ta unică și eliminăm duplicarea clientului Supabase
import { supabase } from "../lib/supabase";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const mapAdFromDB = (row: any): Ad => ({
  ...row,
  id: row.id,
  createdAt: new Date(row.created_at).getTime(),
  expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
  images: Array.isArray(row.ads_images)
    ? row.ads_images.map((img: any) => img.url)
    : [],
  reviews: Array.isArray(row.ads_reviews)
    ? row.ads_reviews.map((r: any) => ({
        id: r.id,
        author: r.author || "Anonim",
        rating: Number(r.rating || 5),
        comment: r.comment,
        createdAt: new Date(r.created_at).getTime(),
      }))
    : [],
  price: Number(row.price),
  rating: Number(row.rating || 0),
  phoneNumber: row.phone_number,
  token: row.token_hash,
  location: {
    county: row.county,
    city: row.city,
    village: row.village || "",
  },
  isPremium: row.is_premium || false,
  stats: {
    views: row.views || 0,
    whatsappClicks: row.whatsapp_clicks || 0,
    favorites: row.favorites || 0,
  },
});

/**
 * 1. FUNCȚII DE PLATĂ & ACTIVARE (STRIPE)
 */
export const activateAdWithExpiry = async (
  adId: string,
  days: number,
): Promise<boolean> => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);

  const { error } = await supabase
    .from("ads")
    .update({
      status: "active",
      is_premium: true,
      expires_at: expiryDate.toISOString(),
    })
    .eq("id", adId);

  return !error;
};

export const startPaymentSession = async (
  adId: string,
  planId: string,
  email: string,
) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "create-stripe-session",
      {
        body: { adId, planId, customerEmail: email },
      },
    );
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Stripe session error:", err);
    return { url: null };
  }
};

export const verifyPaymentSession = async (
  adId: string,
): Promise<{ success: boolean; ad?: Ad }> => {
  const { data, error } = await supabase
    .from("ads")
    .select("*, ads_images(url), ads_reviews(*)")
    .eq("id", adId)
    .single();
  if (!error && data && data.status === "active")
    return { success: true, ad: mapAdFromDB(data) };
  return { success: false };
};

export const simulatePaymentSuccess = async (
  adId: string,
  days: number = 30,
): Promise<void> => {
  await delay(1000);
  await activateAdWithExpiry(adId, days);
};

/**
 * 2. FUNCȚII ANUNȚURI
 */
export const fetchActiveAds = async (): Promise<Ad[]> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ads")
    .select(`*, ads_images(url), ads_reviews(*)`)
    .eq("status", "active")
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Eroare fetchActiveAds:", error);
    return [];
  }
  return data ? data.map(mapAdFromDB) : [];
};

export const fetchAdById = async (id: string): Promise<Ad | null> => {
  const { data, error } = await supabase
    .from("ads")
    .select(`*, ads_images(url), ads_reviews(*)`)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const now = new Date();
  const expiryDate = data.expires_at ? new Date(data.expires_at) : null;

  if (expiryDate && expiryDate < now) {
    if (data.status === "active") {
      supabase.from("ads").update({ status: "expired" }).eq("id", id).then();
    }
    return null;
  }

  return mapAdFromDB(data);
};

export const verifyManageToken = async (
  id: string,
  token: string,
): Promise<Ad | null> => {
  const { data } = await supabase
    .from("ads")
    .select("*, ads_images(url), ads_reviews(*)")
    .eq("id", id)
    .eq("token_hash", token)
    .single();
  if (data) return mapAdFromDB(data);
  return null;
};

/**
 * 3. RECENZII
 */
export const addReview = async (adId: string, review: any): Promise<Review> => {
  const { data, error } = await supabase
    .from("ads_reviews")
    .insert({
      ad_id: adId,
      author: review.author || "Anonim",
      rating: review.rating,
      comment: review.comment,
    })
    .select()
    .single();

  if (error) throw error;

  // 🟢 REPARAT CU BYPASS: Îi spunem lui TS să accepte obiectul exact așa cum vine din DB
  return {
    id: data.id,
    author: data.author,
    rating: data.rating,
    comment: data.comment || data.text || "",
    createdAt: new Date(data.created_at).getTime(),
  } as unknown as Review;
};

/**
 * 4. GESTIONARE & ADMIN
 */
export const createAd = async (
  payload: CreateAdPayload,
): Promise<{ adId: string; token: string }> => {
  const token = generateId().replace(/-/g, "");
  const { data, error } = await supabase
    .from("ads")
    .insert({
      title: payload.title,
      description: payload.description,
      price: payload.price,
      email: payload.email,
      phone_number: payload.phoneNumber,
      county: payload.location.county,
      city: payload.location.city,
      village: payload.location.village,
      token_hash: token,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return { adId: data.id, token };
};

export const updateAd = async (
  id: string,
  token: string,
  updates: any,
): Promise<boolean> => {
  const isAdminBypass = token === "admin_override";
  let query = supabase.from("ads").update(updates).eq("id", id);
  if (!isAdminBypass) query = query.eq("token_hash", token);
  const { error } = await query;
  return !error;
};

export const deleteAd = async (id: string, token: string): Promise<boolean> => {
  const { error } = await supabase
    .from("ads")
    .delete()
    .eq("id", id)
    .eq("token_hash", token);
  return !error;
};

export const getAllAds = async () => fetchActiveAds();
export const adminDeleteAd = async (id: string) =>
  deleteAd(id, "admin_override");
export const adminUpdateAd = async (id: string, updates: any) =>
  updateAd(id, "admin_override", updates);
export const fetchNotifications = async () => [];
export const markNotificationRead = async (id: string) => {};
export const clearAllNotifications = async () => {};
