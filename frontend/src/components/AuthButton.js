import { useState, useEffect } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import api from '../services/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const REDIRECT_URL = window.location.origin;

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.log('Not authenticated');
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
    } catch (error) {
      console.error('Session error:', error);
      alert('Erreur d\'authentification');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(REDIRECT_URL)}`;
    window.location.href = authUrl;
  };

  const handleLogout = async () => {
    try {
      await api.post(`${BACKEND_URL}/api/auth/logout`);
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-2 text-gray-500">
        Chargement...
      </div>
    );
  }

  if (user) {
    return (
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="text-indigo-600" size={18} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          data-testid="logout-button"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-gray-200">
      <button
        onClick={handleLogin}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-gray-300 hover:border-indigo-500 text-gray-700 hover:text-indigo-600 rounded-lg transition-colors font-medium"
        data-testid="login-button"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Se connecter avec Google</span>
      </button>
      <p className="text-xs text-gray-500 text-center mt-2">
        Connexion sécurisée pour protéger vos données
      </p>
    </div>
  );
}
