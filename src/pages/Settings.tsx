import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { auth } from '../lib/firebase';
import { 
  User, Shield, Bell, MessageSquare, 
  Database, Moon, HelpCircle, LogOut, 
  ChevronRight, ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';

export function Settings() {
  const { profile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleLogout = () => {
    auth.signOut();
  };

  const menuItems = [
    { id: 'account', icon: User, label: 'Account', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
    { id: 'privacy', icon: Shield, label: 'Privacy', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
    { id: 'notifications', icon: Bell, label: 'Notifications', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/20' },
    { id: 'chats', icon: MessageSquare, label: 'Chats', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20' },
    { id: 'storage', icon: Database, label: 'Storage & Data', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20' },
    { id: 'appearance', icon: Moon, label: 'Appearance', color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
    { id: 'help', icon: HelpCircle, label: 'Help', color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-500/20' },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Theme</h3>
              <p className="text-sm text-gray-500 mb-4">Choose how {APP_CONFIG.name} looks to you.</p>
              
              <div className="space-y-0 text-gray-900 dark:text-gray-100">
                <label className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <span className="font-medium">System Default</span>
                  <input type="radio" name="theme" checked={theme === 'system'} onChange={() => setTheme('system')} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                </label>
                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3" />
                <label className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <span className="font-medium">Light</span>
                  <input type="radio" name="theme" checked={theme === 'light'} onChange={() => setTheme('light')} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                </label>
                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3" />
                <label className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <span className="font-medium">Dark</span>
                  <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500" />
                </label>
              </div>
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-4">
             <Button variant="outline" className="w-full justify-start text-left mb-2 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>Log Out</Button>
             <Button variant="outline" className="w-full justify-start text-left text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50">Delete My Account</Button>
          </div>
        );
      case 'privacy':
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-4">
             <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <div className="font-medium">Read Receipts</div>
                  <div className="text-sm text-gray-500">Let others know you read their messages</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-emerald-600 rounded" />
             </label>
          </div>
        );
      case 'notifications':
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-4">
             <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-gray-500">Receive alerts for new messages</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-emerald-600 rounded" />
             </label>
          </div>
        );
      case 'chats':
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-4">
             <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <div className="font-medium">Enter is Send</div>
                  <div className="text-sm text-gray-500">Pressing Enter will send your message</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-emerald-600 rounded" />
             </label>
          </div>
        );
      case 'storage':
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-4">
             <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <div className="font-medium">Media Auto-Download</div>
                  <div className="text-sm text-gray-500">Automatically download photos and videos</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-emerald-600 rounded" />
             </label>
          </div>
        );
      case 'help':
        return (
          <div className="rounded-2xl bg-white dark:bg-gray-900 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center">
            <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.name} className="w-20 h-20 mb-4" />
            <h3 className="text-xl font-bold">{APP_CONFIG.name}</h3>
            <p className="text-gray-500 mb-4">Version 1.0.0</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full rounded-xl">Contact Support</Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (activeSection) {
    return (
      <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <div className="sticky top-0 z-10 flex h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center border-b border-gray-200 bg-white/90 backdrop-blur-md px-4 dark:border-gray-800 dark:bg-gray-950/90">
          <button onClick={() => setActiveSection(null)} className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight capitalize">{activeSection === 'storage' ? 'Storage & Data' : activeSection}</h1>
        </div>
        <div className="p-4 space-y-6">
          {renderSectionContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950 overflow-y-auto pb-24">
      <div className="sticky top-0 z-10 flex h-[calc(4.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] shrink-0 items-center border-b border-gray-100 bg-white/95 backdrop-blur-md px-4 dark:border-gray-800 dark:bg-gray-950/95">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Profile Summary Card */}
        <div 
          className="rounded-2xl bg-white dark:bg-gray-900 p-4 flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:scale-[0.98]"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center gap-4">
            <Avatar src={profile?.avatarUrl} fallback={profile?.displayName || 'U'} size="lg" className="w-16 h-16 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile?.displayName}</h2>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500">@{profile?.username}</p>
            </div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400">
            <ChevronRight size={20} />
          </div>
        </div>

        {/* Settings Menu List */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <button 
                onClick={() => setActiveSection(item.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left active:bg-gray-100 dark:active:bg-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </button>
              {index < menuItems.length - 1 && <div className="h-px bg-gray-100 dark:bg-gray-800 ml-16" />}
            </React.Fragment>
          ))}
        </div>

        {/* Logout */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left active:bg-red-100 dark:active:bg-red-900/30"
          >
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <LogOut size={20} />
            </div>
            <span className="font-medium text-red-600 dark:text-red-400">Log Out</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-gray-500">
          <p className="text-sm font-semibold tracking-wider">from</p>
          <img 
            src={APP_CONFIG.logoUrl} 
            alt={`${APP_CONFIG.name} Logo`}
            className="w-12 h-12 mt-2 opacity-50 grayscale"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <p className="text-xs mt-2 font-medium">{APP_CONFIG.name} v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
