# Security Policy

## Environment Variables

This project uses environment variables to manage sensitive configuration. Never commit these to version control.

### Firebase Configuration

Firebase credentials are managed through environment variables:

```bash
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Setup Instructions

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Get Firebase credentials**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click ⚙️ Settings → Project Settings
   - Copy your Web App credentials
   - Replace the placeholder values in `.env.local`

3. **Verify .gitignore**:
   - Ensure `.env.local` is in `.gitignore` (already configured)
   - Check with: `git status`

4. **Update app.js**:
   - Replace hardcoded config with:
   ```javascript
   import { firebaseConfig, validateFirebaseConfig } from './app-config.js';
   validateFirebaseConfig();
   ```

### Deployment

#### Vercel
1. Go to Project Settings → Environment Variables
2. Add each `VITE_*` variable with its value
3. Redeploy

#### GitHub Pages
1. GitHub Pages serves static files - use a build step to inject variables
2. Alternative: Use a serverless backend to store credentials

#### Self-hosted
1. Create `.env.local` on the server (never commit)
2. Use build process to inject variables: `npm run build`

## Reporting Security Issues

If you discover a security vulnerability, please email **hello@scamscouter.com** instead of using the issue tracker.

## Best Practices

✅ **Do**:
- Use environment variables for all secrets
- Create `.env.local` locally and keep it out of version control
- Rotate credentials if accidentally exposed
- Use HTTPS only
- Keep dependencies updated
- Use strong Firebase security rules

❌ **Don't**:
- Commit `.env` or `.env.local` files
- Hardcode credentials in source code
- Share credentials via email or chat
- Use the same credentials across environments (dev/staging/production)
- Disable Firebase authentication rules

## Rotating Compromised Credentials

If Firebase credentials were exposed:

1. **Disable the API key** in Firebase Console
2. **Create a new key**
3. **Update environment variables** in all deployment targets
4. **Redeploy** the application
5. **Monitor Firebase activity** for unauthorized access

## References

- [Firebase Security Best Practices](https://firebase.google.com/docs/auth/manage-users)
- [OWASP: Secrets Management](https://owasp.org/www-community/Improper_Data_Validation)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes.html)
