// Funcție care transformă titlul în URL (ex: "Miere Bio!" -> "miere-bio")
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFD") // Elimină diacriticele
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "") // Elimină simbolurile speciale
    .replace(/[\s_-]+/g, "-") // Înlocuiește spațiile cu cratimă
    .replace(/^-+|-+$/g, ""); // Elimină cratimele de la capete
};
