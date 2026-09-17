import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { APP_CONFIG } from '../../config';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // useAuthStore will detect the change and navigate via ProtectedRoute
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-gray-50 dark:bg-gray-950 items-center overflow-y-auto">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center px-6 py-12 relative shadow-2xl md:border-x border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        
        <div className="flex flex-col items-center mb-8">
          <img 
            src={APP_CONFIG.logoUrl} 
            alt={`${APP_CONFIG.name} Logo`}
            className="w-20 h-20 mb-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome to {APP_CONFIG.name}</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
              className="rounded-xl h-12"
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <a href="#" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400 font-medium">Forgot password?</a>
            </div>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="rounded-xl h-12"
            />
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base font-medium shadow-sm" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
