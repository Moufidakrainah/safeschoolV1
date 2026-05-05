// Props :
//   label       : texte affiché au-dessus du champ
//   type        : "text" | "email" | "password" (défaut: "text")
//   value       : valeur contrôlée (React state)
//   onChange    : handler de changement
//   placeholder : texte grisé dans le champ vide (optionnel)
//   required    : rend le champ obligatoire (optionnel)
//   theme       : "light" (fond blanc, label blanc) | "dark" (défaut)
//
// Utilisation :
//   <Input
//     label="Identifiant"
//     type="email"
//     value={email}
//     onChange={(e) => setEmail(e.target.value)}
//     theme="light"
//   />

type InputProps = {
  label?: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  theme?: 'light' | 'dark';
  'aria-label'?: string;
};

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  theme = 'dark',
  'aria-label': ariaLabel,
}: InputProps) {

  const labelClass = theme === 'light'
    ? 'text-white text-sm font-medium mb-1 block'
    : 'text-gray-700 text-sm font-medium mb-1 block';

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className={labelClass}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-label={ariaLabel}
        className="w-full px-4 py-3 rounded-full bg-white text-gray-800 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary border-none"
      />
    </div>
  );
}
