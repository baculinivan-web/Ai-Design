# mono - genereate designs from prompt
<img width="3259" height="2112" alt="CleanShot 2026-04-26 at 21 22 37@2x" src="https://github.com/user-attachments/assets/a2c3525f-54f9-42cc-b561-49d7e5e159d7" />

##

Type a prompt, get a design. mono uses LLMs to generate high-fidelity HTML designs with modern visual storytelling.

Social media creatives, print ads, landing pages — mono handles it. Currently in beta: free and unlimited. [Try it today → ](https://f2e12358.mono-4h5.pages.dev/)

## Authentication Setup

This project uses Firebase Authentication with Google.

### 1. Firebase Console Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and activate the **Google** provider.
3. Add `localhost` and your production domain to the **Authorized Domains** list in Firebase Auth settings.

### 2. Local Configuration
1. Create a `.env` file in the root directory (use `.env.example` as a template).
2. Fill in your Firebase configuration keys:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

### 3. Development
Run the development server:
```bash
npm run dev
```
The application will now require authentication to access the design tools. Each user's projects are stored separately in their local storage, namespaced by their Firebase UID.
