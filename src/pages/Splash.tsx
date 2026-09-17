import { APP_CONFIG } from '../config';

export function Splash() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center animate-pulse">
        <img 
          src={APP_CONFIG.logoUrl} 
          alt={`${APP_CONFIG.name} Logo`}
          className="w-24 h-24 mb-4 object-contain drop-shadow-xl"
          onError={(e) => {
            // Fallback if logo not yet available in dev environment
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{APP_CONFIG.name}</h1>
      </div>
    </div>
  );
}
