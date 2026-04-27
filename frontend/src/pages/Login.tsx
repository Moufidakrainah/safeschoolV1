import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      setError('Email ou mot de passe incorrect');
    }
    finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans">

      <div className="flex flex-col items-center justify-center gap-8 w-1/2 bg-surface px-12">

        <div className="flex flex-col items-center gap-10">
          <img src="/logos/safeschool-logo.png" alt="SafeSchool logo" className="w-80 h-80 object-contain" />
        </div>

      </div>

      <div className="flex flex-col items-center justify-center gap-8 w-1/2 bg-primary px-16">

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-sm">

          <Input
            label="Identifiant"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            theme="light"
          />

          <Input
            label="Mot de passe"
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

          <Button type="submbit" variant="login" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>

        </form>
      </div>

    </div>
  );
}
