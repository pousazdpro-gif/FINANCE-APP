import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import api from '../services/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const REDIRECT_URL = window.location.origin;

export default function LoginRequired({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check if session_id in URL fragment
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        await processSessionId(sessionId);
        // Clean URL
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }

      // Check existing session
      const response = await api.get(`${BACKEND_URL}/api/auth/me`);
      setUser(response.data);
      setChecking(false);
      // Dispatch event to notify App that auth is ready
      window.dispatchEvent(new CustomEvent('auth-ready', { detail: { user: response.data } }));
    } catch (error) {
      console.log('Not authenticated');
      setUser(null);
      setChecking(false);
      // Dispatch event even if not authenticated
      window.dispatchEvent(new CustomEvent('auth-ready', { detail: { user: null } }));
    } finally {
      setLoading(false);
    }
  };

  const processSessionId = async (sessionId) => {
    try {
      setLoading(true);
      const response = await api.post(
        `${BACKEND_URL}/api/auth/session?session_id=${sessionId}`
      );
      setUser(response.data.user);
      setChecking(false);
    } catch (error) {
      console.error('Session error:', error);
      setUser(null);
      setChecking(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(REDIRECT_URL)}`;
    window.location.href = authUrl;
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
            <p className="text-gray-600 font-medium">Vérification de la session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20M19 5c-1.5 0-3 3-4.5 5-1.5-2-3-5-4.5-5-1 0-2 0-3 1-1-1-1.5-3-1-4 0 0 0-1 1-4 0-1 0-2 1-2 1 0 1.5 1 2 2 2 0 2 1 4-1 2 2 3 5 2 7 0 1-1 3-1 4 0 1 0 3-1 4z"/>
                <path d="M2 11v1c0 2 2 3 4 3M20 12v1c0 2-2 3-4 3M4 11c0-2 2-3 4-3"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">FinanceApp</h1>
            <p className="text-gray-600">Gestion financière personnelle sécurisée</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Connexion requise</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Vous devez être connecté avec votre compte Google pour accéder à vos données financières personnelles.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-xl transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
            data-testid="login-required-button"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Se connecter avec Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              En vous connectant, vous acceptez que vos données soient stockées de manière sécurisée et isolées de celles des autres utilisateurs.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Pourquoi se connecter ?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Vos données sont isolées et sécurisées</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Accès depuis n'importe quel appareil</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Sauvegarde automatique dans le cloud</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, render the app
  return children;
}
