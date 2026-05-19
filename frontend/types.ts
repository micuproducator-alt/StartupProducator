export enum AdStatus {
  PENDING = "pending",
  ACTIVE = "active",
  EXPIRED = "expired",
}

export interface Location {
  county: string;
  city: string;
  village?: string;
}

export const PRODUCT_CATEGORIES = [
  "Legume",
  "Fructe",
  "Miere & Apicole",
  "Lactate & Brânzeturi",
  "Carne & Mezeluri",
  "Ouă",
  "Torturi & Prăjituri",
  "Dulceață & Zacuști",
  "Băuturi & Siropuri",
  "Făinoase & Patiserie",
  "Artizanat & Lucru Manual",
  "Flori & Plante",
  "Altele",
];

export interface Review {
  id: string;
  author_name: string; // Sincronizat cu DB
  rating: number;
  comment: string;
  created_at: string; // Sincronizat cu DB
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: string;
  slug?: string;
  email: string;
  phone_number: string;
  county: string;
  city: string;
  created_at: string;
  status: AdStatus;
  is_premium: boolean;
  ads_images: { url: string }[];
  // Relația cu categoriile prin tabel pivot (Prisma style)
  ads_categories: {
    categories: {
      name: string;
    };
  }[];
  // Recenziile vin adesea cu author_name din DB
  ads_reviews?: {
    id: string;
    author_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }[];
  rating: number; // Calculat în frontend sau venit din view
}

export interface CreateAdPayload {
  title: string;
  description: string;
  price: number;
  categories: string[];
  email: string;
  phoneNumber: string;
  location: Location;
  images: File[];
  duration: number;
}

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export interface AppNotification {
  id: string;
  type: "success" | "info" | "error";
  message: string;
}
