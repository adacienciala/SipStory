# Supabase Email Templates

This directory contains custom email templates for Supabase Auth flows in SipStory.

## Templates

### 1. confirmation.html

**Purpose:** Sent when a user signs up and needs to confirm their email address.

**Variables:**

- `{{ .SiteURL }}` - The base URL of your site (configured in `config.toml`)
- `{{ .ConfirmationURL }}` - The confirmation link the user needs to click

**Subject:** "Confirm Your Email - SipStory"

### 2. recovery.html

**Purpose:** Sent when a user requests to reset their password.

**Variables:**

- `{{ .SiteURL }}` - The base URL of your site (configured in `config.toml`)
- `{{ .ConfirmationURL }}` - The password reset link (expires in 1 hour)

**Subject:** "Reset Your Password - SipStory"

## Features

Both templates include:

- **Responsive design** - Optimized for mobile and desktop
- **SipStory branding** - Logo from `/public/logo.png`
- **Matcha-themed colors** - Green gradient (#2E7D32 to #4CAF50)
- **Clear CTAs** - Prominent buttons for primary actions
- **Alternative links** - Plain text URLs for accessibility
- **Security notices** - Appropriate warnings for each flow
- **Professional footer** - Branding and copyright information

## Configuration

These templates are configured in `/supabase/config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Confirm Your Email - SipStory"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset Your Password - SipStory"
content_path = "./supabase/templates/recovery.html"
```

## Testing

### Local Development

With Supabase running locally, emails are captured by Inbucket at:

- Web interface: http://localhost:54324
- SMTP: localhost:54325 (if enabled)

### Testing the Templates

1. Start Supabase: `npx supabase start`
2. Sign up a new user or request password reset
3. Check Inbucket at http://localhost:54324
4. View the rendered email

## Customization

To modify the templates:

1. Edit the HTML files in this directory
2. Restart Supabase if running: `npx supabase restart`
3. Test the changes via Inbucket

### Available Variables

Supabase provides these template variables:

- `{{ .SiteURL }}` - Your site URL
- `{{ .ConfirmationURL }}` - The action URL (confirmation/recovery)
- `{{ .Token }}` - The raw token (if needed for custom implementations)
- `{{ .TokenHash }}` - The hashed token
- `{{ .Email }}` - The user's email address
- `{{ .Data }}` - Additional custom data

## Production Deployment

When deploying to production:

1. Ensure your production `site_url` is set correctly in Supabase dashboard
2. Configure SMTP settings for email delivery
3. Test the email flow with real email addresses
4. Monitor email delivery rates

## Brand Colors

- Primary Green: `#2E7D32`
- Secondary Green: `#4CAF50`
- Gradient: `linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)`

## Resources

- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Go Template Syntax](https://pkg.go.dev/text/template) (used by Supabase)
