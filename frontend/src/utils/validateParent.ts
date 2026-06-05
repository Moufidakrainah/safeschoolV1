const nameRegex = /^[a-zA-ZÀ-ÿ'\-]{2,20}$/;

export function validateParentField(field: string, value: string): string {
  if (field === 'firstName') {
    if (!value.trim()) return 'Prénom obligatoire';
    if (!nameRegex.test(value)) return 'Prénom invalide (lettres et tirets, 2-20 caractères)';
  } else if (field === 'lastName') {
    if (!value.trim()) return 'Nom obligatoire';
    if (!nameRegex.test(value)) return 'Nom invalide (lettres et tirets, 2-20 caractères)';
  } else if (field === 'email') {
    if (!value.trim()) return 'Email obligatoire';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format email invalide';
    if (value.length > 50) return 'Email trop long (max 50 caractères)';
  } else if (field === 'phone' && value.length > 0) {
    if (!/^[0-9+\s]{0,15}$/.test(value)) return 'Téléphone invalide (chiffres, + et espaces)';
  }
  return ''; // pas d'erreur
}
