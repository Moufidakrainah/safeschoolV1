// Généré par shadcn/ui (npx shadcn@latest init).
// shadcn n'est PAS une lib npm classique : au lieu d'installer un paquet,
// il copie directement le code source des composants dans le projet.
// On possede le code et on peut le modifier
//
// Ce fichier expose cn(), un helper qui fusionne des classes Tailwind :
//   cn("px-4", condition && "bg-primary")  →  "px-4 bg-primary" (ou "px-4")
// Il est importé par tous les composants shadcn dans src/components/ui/.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
