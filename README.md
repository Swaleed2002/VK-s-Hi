# Messaging App

A complete real-time messaging application with voice/video calling, group chats, and media sharing. Built for modern web and Android.

## Features

- **Authentication:** Email/password sign-in with unique `@usernames` (no phone number required).
- **Real-Time Messaging:** Instant text, images, video, audio, and file transfers using Firebase Firestore.
- **Voice & Video Calling:** Peer-to-peer secure calling utilizing WebRTC with Firestore as the signaling channel.
- **Responsive Design:** Mobile-first architecture that elegantly expands to a two-pane layout on desktop.
- **Dark Mode:** Native system-based dark mode support built-in.
- **Offline Resilience:** Leverages Firestore's offline persistence for robust network handling.

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide React (icons)
- **State Management:** Zustand
- **Backend & Realtime:** Firebase (Auth, Firestore, Storage)
- **Calling:** WebRTC (RTCPeerConnection)
- **Mobile Packaging:** Capacitor

## Setup Guide

### 1. Firebase Setup
1. Create a Firebase Project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password provider).
3. Enable **Firestore Database** (Start in production mode).
4. Enable **Firebase Storage** (Start in production mode).
5. Deploy the security rules provided in `/firestore.rules` to your Firebase project.

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Local Development
Install dependencies and run the development server:
```bash
npm install
npm run dev
```

### 4. Android Build
We use Capacitor to build the Android application.
```bash
npm run build
npx cap sync android
npx cap open android
```
Build the APK via Android Studio.

## Architecture

See `ARCHITECTURE.md` for a detailed breakdown of the database schema and signaling lifecycle.

## Free-Tier & Future Costs

This application is designed to operate entirely within the generous free tiers of Firebase and public STUN servers for Version 1. 

**Potential Future Costs:**
- **Database (Firestore):** Free tier includes 50k reads, 20k writes per day. Chatty applications may eventually exceed this.
- **Storage:** Free tier offers 5GB of storage. Large video or image uploads may necessitate a paid plan.
- **WebRTC Relay (TURN):** Currently uses Google's free STUN servers. STUN works for ~80% of calls. For 100% reliability across strict firewalls/NATs, a paid TURN server (like Twilio or Metered) will be required. 
- **Push Notifications:** Firebase Cloud Messaging (FCM) is completely free, but integrating it reliably on all mobile OS backgrounds may require paid Apple Developer accounts (for iOS).
