import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input  from '../components/Input';

export default function Login()
{
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try
    {
      const data = await login(email, password);
      loginUser(data.access_token, data.user);
      if (data.user.role === 'student')
        navigate('/student');
      else if (data.user.role === 'teacher' || data.user.role === 'staff')
        navigate('/reporter');
      else
        navigate('/dashboard');
    }
    catch
    {
      setError(t('login.error'));
    }
    finally
    {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 font-sans">

      <div className="flex flex-col items-center justify-center gap-8 w-1/2 bg-surface px-12 self-stretch">

          <img src="/logos/safeschool-logo.png" alt="SafeSchool logo" className="w-80 h-80 object-contain" />

      </div>

      <div className="flex flex-col items-center justify-center gap-8 w-1/2 bg-primary px-16 self-stretch">

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-sm">

          <Input
            label={t('login.labelEmail')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            theme="light"
          />

          <Input
            label={t('login.labelPassword')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            theme="light"
          />

          {error && (
            <p className="text-white text-sm bg-critical/30 px-4 py-2 rounded-lg w-full text-center">
              ⚠️ {error}
            </p>
          )}

          <Button type="submit" variant="login" disabled={loading}>
            {loading ? t('login.loading') : t('login.submit')}
          </Button>

        </form>
      </div>

    </main>
  );
}
