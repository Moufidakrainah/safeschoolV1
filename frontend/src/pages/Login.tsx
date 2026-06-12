import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── Validators alignés avec LoginDto ──────────────────────────────────────
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value: string): string => {
  if (!value) return 'Email obligatoire';
  if (value.length > 50) return 'Email trop long (50 caractères max)';
  if (!emailRegex.test(value)) return "Format d'email invalide";
  return '';
};

const validatePassword = (value: string): string => {
  if (!value) return 'Mot de passe obligatoire';
  if (value.length < 6) return 'Mot de passe trop court';
  return '';
};
// ──────────────────────────────────────────────────────────────────────────

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isFormValid = () => !validateEmail(email) && !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    try {
      const data = await login(email, password);
      loginUser(data.access_token, data.user);
      if (data.user.role === 'student') navigate('/student');
      else if (data.user.role === 'teacher') navigate('/reporter');
      else navigate('/dashboard');
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col md:flex-row font-sans">

      <div className="flex flex-col items-center justify-center gap-8 w-full md:w-1/2 bg-surface px-12 py-10 md:self-stretch">
        <img src="/logos/safeschool-logo.png" alt="SafeSchool logo" className="w-80 h-80 object-contain" />
      </div>

      <div className="flex flex-col items-center justify-center gap-8 w-full md:w-1/2 bg-primary px-8 md:px-16 py-10 md:self-stretch">

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-sm">

          <div className="flex flex-col gap-1 w-full">
            <Label className="text-white text-sm font-medium">{t('login.labelEmail')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                setEmailError(validateEmail(value));
              }}
              required
              className="rounded-full bg-white text-gray-800 border-none px-4 py-3 h-auto text-sm"
            />
            <div className="min-h-5">
              {emailError && <p className="text-red-300 text-xs text-left">{emailError}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <Label className="text-white text-sm font-medium">{t('login.labelPassword')}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => {
                const value = e.target.value;
                setPassword(value);
                setPasswordError(validatePassword(value));
              }}
              required
              className="rounded-full bg-white text-gray-800 border-none px-4 py-3 h-auto text-sm"
            />
            <div className="min-h-5">
              {passwordError && <p className="text-red-300 text-xs text-left">{passwordError}</p>}
            </div>
          </div>

          <div className="min-h-10 w-full">
            {error && <p className="text-red-300 text-l w-full text-center">{t('login.error')}</p>}
          </div>

          <Button type="submit" variant="login" disabled={loading || !isFormValid()}>
            {loading ? t('login.loading') : t('login.submit')}
          </Button>

        </form>
      </div>

    </main>
  );
}
