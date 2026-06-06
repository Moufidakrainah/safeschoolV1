import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// ── Types ──
interface ParentForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

interface ParentFormItemProps {
  parent: ParentForm;       // données du parent
  idx: number;              // index (0 ou 1) → "Parent 1" ou "Parent 2"
  onChange: (updated: ParentForm) => void; // appelée quand un champ change
  onRemove: () => void;     // appelée quand on clique "Supprimer"
  dark?: boolean;           // true = fond sombre (dans renderUserForm), false = fond clair (dans AdminUserProfile)
}

// ── Validation ──
function validateField(field: string, value: string): string {
  const nameRegex = /^[a-zA-ZÀ-ÿ'\-]{2,20}$/;
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
  return '';
}

// ── Composant ──
export default function ParentFormItem({ parent, idx, onChange, onRemove, dark = false }: ParentFormItemProps) {

  // État local des erreurs — possible car c'est un composant !
  const [errors, setErrors] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  // Couleurs selon le contexte (sombre dans renderUserForm, clair dans AdminUserProfile)
  const labelClass = dark ? 'text-white/80 text-xs' : 'text-xs';
  const inputClass = dark ? 'bg-white mt-1 h-8 text-sm' : 'mt-1';
  const errorClass = dark ? 'text-red-300 text-xs mt-1' : 'text-red-500 text-xs mt-1';
  const containerClass = dark ? 'bg-white/10 rounded-lg p-3 mb-2 flex flex-col gap-2' : 'bg-gray-50 rounded-lg p-3 mb-2 flex flex-col gap-2';

  return (
    <div className={containerClass}>
      {/* En-tête : Parent 1/2 + bouton Supprimer */}
      <div className="flex justify-between items-center">
        <span className={dark ? 'text-white text-xs font-semibold' : 'text-xs font-semibold text-gray-700'}>
          Parent {idx + 1}
        </span>
        <button
          type="button"
          className={dark ? 'text-white/60 hover:text-white text-xs' : 'text-gray-400 hover:text-red-500 text-xs'}
          onClick={onRemove}
        >
          ✕ Supprimer
        </button>
      </div>

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className={labelClass}>Prénom</Label>
          <Input
            value={parent.firstName}
            onChange={e => {
              const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '');
              const normalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
              onChange({ ...parent, firstName: normalized });
              setErrors(prev => ({ ...prev, firstName: validateField('firstName', normalized) }));
            }}
            maxLength={20}
            className={inputClass}
          />
          {errors.firstName && <p className={errorClass}>{errors.firstName}</p>}
        </div>
        <div>
          <Label className={labelClass}>Nom</Label>
          <Input
            value={parent.lastName}
            onChange={e => {
              const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '').toUpperCase();
              onChange({ ...parent, lastName: val });
              setErrors(prev => ({ ...prev, lastName: validateField('lastName', val) }));
            }}
            maxLength={20}
            className={inputClass}
          />
          {errors.lastName && <p className={errorClass}>{errors.lastName}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <Label className={labelClass}>Email</Label>
        <Input
          type="email"
          value={parent.email}
          onChange={e => {
            onChange({ ...parent, email: e.target.value });
            setErrors(prev => ({ ...prev, email: validateField('email', e.target.value) }));
          }}
          maxLength={50}
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email}</p>}
      </div>

      {/* Téléphone */}
      <div>
        <Label className={labelClass}>Téléphone <span className="opacity-60">(optionnel)</span></Label>
        <Input
          value={parent.phone}
          onChange={e => {
            const val = e.target.value.replace(/[^0-9+\s]/g, '');
            onChange({ ...parent, phone: val });
            setErrors(prev => ({ ...prev, phone: validateField('phone', val) }));
          }}
          maxLength={15}
          placeholder="ex: +33 6 12 34 56 78"
          className={inputClass}
        />
        {errors.phone && <p className={errorClass}>{errors.phone}</p>}
      </div>

      {/* Adresse */}
      <div>
        <Label className={labelClass}>Adresse <span className="opacity-60">(optionnel)</span></Label>
        <Input
          value={parent.address}
          onChange={e => onChange({ ...parent, address: e.target.value })}
          maxLength={80}
          className={inputClass}
        />
      </div>
    </div>
  );
}