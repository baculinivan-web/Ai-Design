import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMessage } from './ErrorMessage';
import './SignInScreen.css';

export function SignInScreen() {
  const { signInWithGoogle, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      // Error is handled by AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="app-shell centered sign-in-screen">
      <div className="center-stage">
        <div className="hero">
          <h1 className="hero-title">mono</h1>
          <p className="hero-sub">Sign in to start designing</p>
        </div>

        <div className="auth-options">
          <button 
            className="auth-btn google" 
            onClick={handleSignIn}
            disabled={isSigningIn}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
        </div>

        {error && (
          <div className="auth-error-container">
            <ErrorMessage message={error} onRetry={clearError} />
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
      <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z" fill="#34A853"/>
      <path d="M5.50253 14.3003C5.25363 13.5541 5.121 12.7599 5.121 11.9504C5.121 11.1409 5.25363 10.3467 5.50253 9.60049V6.50964H1.5166C0.67248 8.146 0.199707 9.99805 0.199707 11.9504C0.199707 13.9027 0.67248 15.7547 1.5166 17.3912L5.50253 14.3003Z" fill="#FBBC05"/>
      <path d="M12.2401 4.74966C14.0074 4.74966 15.6027 5.35626 16.8519 6.54494L20.2739 3.12296C18.197 1.19114 15.4678 0 12.2401 0C7.7029 0 3.55371 2.55745 1.5166 6.50964L5.50705 9.60049C6.45946 6.76084 9.11388 4.74966 12.2401 4.74966Z" fill="#EA4335"/>
    </svg>
  );
}
