import { z } from "zod";

export const CreateAdSchema = z.object({
  title: z.string().min(3, "Titlul este prea scurt (minim 3 caractere)"),
  slug: z.string().min(3, "Slug-ul este invalid"),
  description: z.string().min(10).max(5000),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Prețul nu poate fi negativ"),
  ),
  email: z.string().email("Adresa de email nu este validă"),
  phone_number: z.string().min(10, "Telefonul trebuie să aibă minim 10 cifre"),
  county: z.string().min(2, "Selectați județul"),
  city: z.string().min(2, "Selectați orașul"),
  categoryId: z.preprocess((val) => Number(val), z.number().int()),
  images: z.array(z.string()).optional(),
  // Ne asigurăm că acceptăm planul trimis din frontend
  plan_type: z.enum(["basic", "standard", "premium"]).default("basic"),
});

export const UpdateAdSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().optional(),
  phone_number: z.string().min(10).optional(),
  status: z.enum(["active", "pending", "expired", "deleted"]).optional(),
  is_premium: z.boolean().optional(),
});
