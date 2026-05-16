import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Login()
{
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const isFormValid = () => {
	return (
		emailRegex.test(email) &&
		password.length >= 6
	);
	};
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
	if (!isFormValid()) {
		setError('login.error');
		return;
	}
    e.preventDefault();
    setError('');

	// --- VALIDATION FRONTEND ---
	if (!email || !password) {
		setError(t('login.errorRequired')); // "Veuillez remplir tous les champs"
		return;
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		setError(t('login.errorEmailFormat')); // "Format d'email invalide"
		return;
	}

	if (password.length < 6) {
		setError(t('login.errorPasswordLength')); // "Mot de passe trop court"
		return;
	}
	
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

		<div className="flex flex-col gap-1 w-full">
		  <Label className="text-white text-sm font-medium">{t('login.labelEmail')}</Label>
		  <Input
			type="email"
			value={email}
			onChange={(e) => {
				const value = e.target.value;
				setEmail(value);

				if (!emailRegex.test(value)) {
				setEmailError(t('login.errorEmailFormat'));
				} else {
				setEmailError('');
				}
			}}
			required
			className="rounded-full bg-white text-gray-800 border-none px-4 py-3 h-auto text-sm"
		  />
		</div>
		<div className="min-h-5 w-full">
		{emailError && (
			<p className="text-red-300 text-xs w-full text-left">
			{t('login.errorEmailFormat')}
			</p>
		)}
		</div>



		<div className="flex flex-col gap-1 w-full">
		  <Label className="text-white text-sm font-medium">{t('login.labelPassword')}</Label>
		  <Input
			type="password"
			value={password}
			onChange={(e) => {
				const value = e.target.value;
				setPassword(value);

				if (value.length < 6) {
				setPasswordError(t('login.errorPasswordLength'));
				} else {
				setPasswordError('');
				}
			}}
			required
			className="rounded-full bg-white text-gray-800 border-none px-4 py-3 h-auto text-sm"
		  />
		</div>
		<div className="min-h-5 w-full">
		{passwordError && (
			<p className="text-red-300 text-xs w-full text-left">
			{t('login.errorPasswordLength')}
			</p>
		)}
		</div>


		<div className="min-h-10 w-full">
				{error && (
					<p className="text-red-300 text-l w-full text-center">
					{t('login.error')}
					</p>
				)}
		</div>

          <Button type="submit" variant="login" disabled={loading || !isFormValid()}>
            {loading ? t('login.loading') : t('login.submit')}
          </Button>

        </form>
      </div>

    </main>
  );
}
