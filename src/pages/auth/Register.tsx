import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { APP_CONFIG } from '../../config';
import { useAuthStore } from '../../store/useAuthStore';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setProfile = useAuthStore(state => state.setProfile);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,15}$/.test(cleanUsername)) {
      setError('Username must be 3-15 characters long and contain only lowercase letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    try {
      // 1. Check if username is taken (UX check)
      const usernameRef = doc(db, 'usernames', cleanUsername);
      try {
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
          setError('Username is already taken');
          setLoading(false);
          return;
        }
      } catch (checkErr: any) {
        if (checkErr.message?.includes('offline')) {
          setError('Unable to connect to the server. Check your internet connection and try again.');
          setLoading(false);
          return;
        }
      }

      // 2. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Reserve username (Atomic check thanks to firestore rules: allow update: if false)
      try {
        await setDoc(usernameRef, { uid: user.uid });
      } catch (reserveErr: any) {
        await user.delete();
        setError('Username was taken just now or a connection error occurred. Please try a different one.');
        setLoading(false);
        return;
      }

      // 4. Create user profile
      const newProfile = {
        id: user.uid,
        username: cleanUsername,
        displayName: displayName.trim(),
        email: user.email!,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
        privacySettings: {
          lastSeen: 'everyone',
          readReceipts: true
        }
      };
      
      try {
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (profileErr: any) {
        await user.delete().catch(() => {});
        setError('Failed to initialize profile. Please try registering again.');
        setLoading(false);
        return;
      }
      
      setProfile(newProfile as any);
      navigate('/', { replace: true });
    } catch (err: any) {
      if (err.message?.includes('offline')) {
        setError('Unable to connect to the server. Check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to create account');
      }
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
            className="w-16 h-16 mb-4 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create an account</h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-900/50">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
            <Input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              required 
              placeholder="John Doe"
              className="rounded-xl h-11"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 font-medium">@</span>
              <Input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                className="pl-8 rounded-xl h-11"
                placeholder="johndoe"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com"
              className="rounded-xl h-11"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm</label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-base font-medium shadow-sm" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
