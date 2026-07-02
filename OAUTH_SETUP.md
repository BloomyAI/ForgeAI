# OAuth Provider Setup Instructions

The error "Unsupported provider: provider is not enabled" means you need to enable OAuth providers in your Supabase dashboard.

## Enable Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Click on "Google" provider
3. Toggle "Enable Sign in with Google" to ON
4. Add your Google OAuth credentials:
   - **Client ID**: `782081669785-uhif8o5rkl91qmqcnse18a50lc1vbrmj.apps.googleusercontent.com`
   - **Client Secret**: `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`
5. Add redirect URL: `https://forgeaiweb.vercel.app/api/auth/callback/google`
6. Click Save

## Enable Discord OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Click on "Discord" provider
3. Toggle "Enable Sign in with Discord" to ON
4. Add your Discord OAuth credentials:
   - **Client ID**: `1518000230027755520`
   - **Client Secret**: `muiVy-ctua7Go3MA5jm-10j9kNp9bTn2`
5. Add redirect URL: `https://forgeaiweb.vercel.app/api/auth/callback/discord`
6. Click Save

## Additional Redirect URLs

Make sure to also add these redirect URLs in the "Site URL" section:
- `https://forgeaiweb.vercel.app/auth`
- `https://forgeaiweb.vercel.app/dashboard`

## Testing

After enabling both providers:
1. Go to https://forgeaiweb.vercel.app/auth
2. Try clicking "Continue with Google"
3. Try clicking "Continue with Discord"
4. Both should now work without the "provider not enabled" error
