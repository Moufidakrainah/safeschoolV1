// Formate le prénom et le nom d'un utilisateur
// Prénom : première lettre majuscule + reste minuscule
// Nom : tout en majuscule
export const formatName = (firstName: string, lastName: string) => ({
  first: (firstName || "")
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("-"),
  last: (lastName || "").toUpperCase(),
});
