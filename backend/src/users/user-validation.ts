export function validateUserFields(dto: {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  subject?: string;
  currentFirstName?: string;
  currentLastName?: string;
}): string | null {

  const nameRegex = /^[a-zA-ZÀ-ÿ'\-]{2,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Prénom
  if (dto.firstName !== undefined) {
    if (!nameRegex.test(dto.firstName))
      return 'Le prénom doit contenir uniquement des lettres, apostrophes ou tirets (max 20 caractères)';
  }

  // Nom
  if (dto.lastName !== undefined) {
    if (!nameRegex.test(dto.lastName))
      return 'Le nom doit contenir uniquement des lettres, apostrophes ou tirets (max 20 caractères)';
  }

  // Email
  if (dto.email !== undefined) {
    if (dto.email.length > 50)
      return 'L\'email ne peut pas dépasser 50 caractères';
    if (!emailRegex.test(dto.email))
      return 'Format d\'email invalide';
  }

  // Mot de passe
  if (dto.password !== undefined && dto.password.length > 0) {
    if (dto.password.length < 12)
      return 'Le mot de passe doit contenir au moins 12 caractères';
    if (dto.password.length > 20)
      return 'Le mot de passe ne peut pas dépasser 20 caractères';
    if (!/[0-9]/.test(dto.password))
      return 'Le mot de passe doit contenir au moins un chiffre';
    if (!/[a-z]/.test(dto.password))
      return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/[A-Z]/.test(dto.password))
      return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[^a-zA-Z0-9]/.test(dto.password))
      return 'Le mot de passe doit contenir au moins un caractère spécial';
    // Pas le prénom ou nom dedans
    if (dto.currentFirstName && dto.password.toLowerCase().includes(dto.currentFirstName.toLowerCase()))
      return 'Le mot de passe ne doit pas contenir le prénom';
    if (dto.currentLastName && dto.password.toLowerCase().includes(dto.currentLastName.toLowerCase()))
      return 'Le mot de passe ne doit pas contenir le nom de famille';
  }

  // Matière (prof)
  if (dto.subject !== undefined && dto.subject.length > 50)
    return 'La matière ne peut pas dépasser 50 caractères';

  return null;
}
