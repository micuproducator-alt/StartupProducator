// Funcție care transformă titlul în URL (ex: "Miere Bio!" -> "miere-bio")
// Include: eliminare diacritice, limitare lungime, fallback pentru titluri invalide.

const MAX_SLUG_LENGTH = 60; // suficient pentru SEO, evită URL-uri excesiv de lungi

export const generateSlug = (title: string): string => {
  const slug = title
    .toLowerCase()
    .trim()
    .normalize("NFD") // Elimină diacriticele
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "") // Elimină simbolurile speciale
    .replace(/[\s_-]+/g, "-") // Înlocuiește spațiile cu cratimă
    .replace(/^-+|-+$/g, ""); // Elimină cratimele de la capete

  // Fallback: dacă titlul era gol sau conținea doar simboluri/emoji,
  // slug-ul rezultat ar fi string gol -> evităm URL-uri de tipul "/anunt/-x7f2a"
  const safeSlug = slug.length > 0 ? slug : "produs";

  // Limitează lungimea, dar tăiat la o cratimă întreagă (nu la mijlocul unui cuvânt)
  if (safeSlug.length <= MAX_SLUG_LENGTH) return safeSlug;

  const truncated = safeSlug.slice(0, MAX_SLUG_LENGTH);
  const lastDash = truncated.lastIndexOf("-");
  return lastDash > 0 ? truncated.slice(0, lastDash) : truncated;
};

// Generează slug-ul final unic pentru un anunț (title + sufix random pentru unicitate)
// Centralizat aici ca să nu se repete logica random.toString(36) în mai multe fișiere.
export const generateUniqueAdSlug = (title: string): string => {
  const base = generateSlug(title);
  const uniqueSuffix = Math.random().toString(36).substring(2, 8); // 6 caractere, mai stabil decât .substring(7)
  return `${base}-${uniqueSuffix}`;
};
