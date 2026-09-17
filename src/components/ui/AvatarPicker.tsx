import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Camera as CameraIcon, Upload, Trash2, X } from 'lucide-react';
import { Avatar } from './Avatar';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuthStore } from '../../store/useAuthStore';

interface AvatarPickerProps {
  currentUrl?: string;
  fallback: string;
}

export function AvatarPicker({ currentUrl, fallback }: AvatarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { profile, setProfile } = useAuthStore();

  const handleUpdate = async (imageUrl: string | null) => {
    if (!profile || !auth.currentUser) return;
    
    setUploading(true);
    try {
      const userRef = doc(db, 'users', profile.id);
      
      if (!imageUrl) {
        // Delete
        if (currentUrl) {
          try {
            const storage = getStorage();
            const imageRef = ref(storage, `avatars/${profile.id}`);
            await deleteObject(imageRef);
          } catch (e) {
            console.error("Failed to delete from storage", e);
          }
        }
        await updateDoc(userRef, { avatarUrl: null });
        setProfile({ ...profile, avatarUrl: undefined });
      } else {
        // We received a base64 string or web path. Let's upload base64.
        const storage = getStorage();
        const imageRef = ref(storage, `avatars/${profile.id}`);
        // imageUrl from Capacitor will be a dataUrl if we request DataUrl, or base64
        await uploadString(imageRef, imageUrl, 'data_url');
        const downloadUrl = await getDownloadURL(imageRef);
        await updateDoc(userRef, { avatarUrl: downloadUrl });
        setProfile({ ...profile, avatarUrl: downloadUrl });
      }
    } catch (e) {
      console.error("Failed to update avatar", e);
      alert("Failed to update profile photo");
    } finally {
      setUploading(false);
      setIsOpen(false);
    }
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      if (image.dataUrl) {
        handleUpdate(image.dataUrl);
      }
    } catch (e) {
      console.log('User cancelled or error', e);
    }
  };

  const chooseGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });
      if (image.dataUrl) {
        handleUpdate(image.dataUrl);
      }
    } catch (e) {
      console.log('User cancelled or error', e);
    }
  };

  // Fallback web file input for pure browser environment without PWA elements installed
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleUpdate(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="relative inline-block group">
        <Avatar src={currentUrl} fallback={fallback} size="lg" className="w-24 h-24 text-2xl shadow-md" />
        <button 
          onClick={() => setIsOpen(true)}
          disabled={uploading}
          className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <CameraIcon size={16} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl p-4 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Photo</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              {Capacitor.isNativePlatform() || true ? (
                <>
                  <button 
                    onClick={takePhoto}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-200"
                  >
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                      <CameraIcon size={20} />
                    </div>
                    <span className="font-medium">Take Photo</span>
                  </button>
                  <button 
                    onClick={chooseGallery}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-200"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                      <Upload size={20} />
                    </div>
                    <span className="font-medium">Choose from Gallery</span>
                  </button>
                </>
              ) : (
                <label className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-700 dark:text-gray-200 cursor-pointer">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    <Upload size={20} />
                  </div>
                  <span className="font-medium">Upload Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                </label>
              )}
              
              {currentUrl && (
                <button 
                  onClick={() => handleUpdate(null)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-red-600 dark:text-red-400"
                >
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                    <Trash2 size={20} />
                  </div>
                  <span className="font-medium">Remove Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
