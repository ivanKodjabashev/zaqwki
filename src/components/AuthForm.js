import { useState } from 'react';
import { registerWithEmail, signInWithEmail } from '../firebase';
import './authForm.css';

const SAVED_EMAIL_KEY = 'zaqwki.savedEmail';

const getAuthErrorMessage = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Този имейл вече е регистриран.';
    case 'auth/invalid-email':
      return 'Имейл адресът не е валиден.';
    case 'auth/missing-password':
      return 'Въведи парола.';
    case 'auth/weak-password':
      return 'Паролата трябва да е поне 6 символа.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Невалиден имейл или парола.';
    case 'auth/too-many-requests':
      return 'Има твърде много опити. Изчакай малко и пробвай пак.';
    default:
      return 'Неуспешна автентикация. Провери данните и опитай отново.';
  }
};

function AuthForm() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(SAVED_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem(SAVED_EMAIL_KEY));
    } catch {
      return false;
    }
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCreateMode = mode === 'signup';

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Попълни имейл и парола.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (isCreateMode) {
        await registerWithEmail(trimmedEmail, password, rememberMe);
      } else {
        await signInWithEmail(trimmedEmail, password, rememberMe);
      }

      if (rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, trimmedEmail);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setErrorMessage('');
  };

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-label="Email authentication">
        <div className="auth-card-copy">
          <h1>{isCreateMode ? 'Създай профил' : 'Вход'}</h1>
          <p className="auth-subtitle">
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field" htmlFor="auth-email">
            <span>Email</span>
            <input
              id="auth-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-field" htmlFor="auth-password">
            <span>Парола</span>
            <input
              id="auth-password"
              type="password"
              name="password"
              autoComplete={isCreateMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="auth-remember" htmlFor="auth-remember">
            <input
              id="auth-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Запомни ме</span>
          </label>

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Изчакване...'
              : isCreateMode
                ? 'Създай профил'
                : 'Влез'}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={toggleMode}>
          {isCreateMode
            ? 'Имаш профил? Влез'
            : 'Нямаш профил? Създай нов'}
        </button>

      </section>
    </div>
  );
}

export default AuthForm;