# Contact Form Setup Guide

## Files Created

1. **API Route**: `app/api/contact/route.ts`
   - Handles POST requests from the contact form
   - Validates input (name, email, message)
   - Sends email using Resend

2. **Updated Component**: `app/components/Contact.tsx`
   - Client-side form with loading states
   - Success/error message display
   - Form validation

3. **Environment Template**: `.env.local.example`
   - Template for environment variables

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the key (starts with `re_`)

### 2. Configure Environment Variables

Create a `.env.local` file in the root of your project:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your values:

```env
RESEND_API_KEY=re_your_actual_api_key_here
CONTACT_EMAIL=thieu.le0330@gmail.com
```

### 3. Update Email From Address (Optional)

In `app/api/contact/route.ts`, update the `from` field:

```typescript
from: "Portfolio Contact Form <onboarding@resend.dev>",
```

To use your own domain:
1. Add and verify your domain in Resend
2. Update to: `"Portfolio Contact Form <contact@yourdomain.com>"`

### 4. Test the Form

1. Start your dev server: `npm run dev`
2. Navigate to the contact section
3. Fill out and submit the form
4. Check your email inbox

## Features

- ✅ Form validation (name, email, message)
- ✅ Loading state during submission
- ✅ Success message after submission
- ✅ Error handling with user-friendly messages
- ✅ HTML and plain text email formats
- ✅ Reply-to set to sender's email
- ✅ Production-ready error handling

## Troubleshooting

**Email not sending?**
- Check that `RESEND_API_KEY` is set correctly
- Verify `CONTACT_EMAIL` is correct
- Check browser console and server logs for errors
- Ensure your Resend account is active

**API route not found?**
- Make sure the file is at `app/api/contact/route.ts`
- Restart your dev server after creating the route

**CORS errors?**
- Next.js API routes handle CORS automatically
- If issues persist, check your Next.js version (should be 13+)
