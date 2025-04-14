# 🛡️ Supabase & Stripe API Security Guide

A comprehensive guide for implementing secure API key management, preventing attacks, and avoiding unexpected costs.

## 🚀 Quick Start

1. Never hardcode API keys – Use .env + environment variables
2. Enable RLS (Row Level Security) on all Supabase tables
3. Restrict Stripe keys to server-side usage only
4. Add rate limiting to prevent abuse

## 🔐 Security Implementation Guide

### 1. Environment Setup

#### Step 1: Create .env File
```env
# Supabase (Frontend)  
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-ID].supabase.co  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  

# Supabase (Backend - NEVER expose!)  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  

# Stripe  
STRIPE_SECRET_KEY=your_secret_key  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key  
```

#### Step 2: Add .env to .gitignore
```gitignore
# Security  
.env  
*.env.local  
```

### 2. Supabase Security

#### Enable Row Level Security (RLS)

Run in SQL Editor (Supabase Dashboard):
```sql
-- Enable RLS on all tables  
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;  

-- Example: Only allow users to read their own data  
CREATE POLICY "User access only" ON your_table  
FOR SELECT USING (auth.uid() = user_id);  
```

#### Restrict Anon Key Permissions
- Disable all INSERT/UPDATE/DELETE for anon role unless absolutely necessary
- Use auth.uid() checks in RLS policies

### 3. Stripe Security

#### API Key Management
- NEVER use STRIPE_SECRET_KEY in frontend code
- Only use secret keys in server-side APIs (Next.js API routes, Cloud Functions)
- Use NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for frontend operations

#### Stripe API Best Practices
1. Use test keys (sk_test_...) in development
2. Restrict API keys in Stripe Dashboard:
   - Enable IP whitelisting
   - Limit permissions per key
   - Restrict to specific endpoints

### 4. Rate Limiting & Abuse Prevention

#### Implementation Example (Node.js)
```javascript
// Next.js API route (pages/api/endpoint.js)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests
});

export default limiter(async (req, res) => {
  // Your API logic
});
```

### 5. Monitoring & Alerts

#### Usage Monitoring
1. Supabase Dashboard → Logs → API Usage
   - Monitor for unusual spikes
   - Set up email alerts for abnormal usage

2. Stripe Dashboard → Monitoring
   - Set up fraud detection rules
   - Configure webhook notifications

### 6. Emergency Response Plan

#### If API Keys Are Compromised

1. Immediate Actions:
   - Rotate compromised keys immediately
   - Revoke old keys
   - Update all environment variables

2. Git History Cleanup (if .env was committed):
```bash
git filter-repo --force --invert-paths --path .env
git push origin --force --all
```

3. Database Lockdown:
```sql
-- Disable all anon access temporarily
UPDATE auth.users 
SET banned_until = '2099-01-01' 
WHERE role = 'anon';
```

## 📋 Security Checklist

- [ ] Environment variables properly configured
- [ ] .env added to .gitignore
- [ ] RLS enabled on all tables
- [ ] Anon key permissions restricted
- [ ] Stripe secret key used server-side only
- [ ] Rate limiting implemented
- [ ] Usage monitoring configured
- [ ] Emergency response plan documented

## 🔄 Regular Security Maintenance

1. Monthly Tasks:
   - Review API key permissions
   - Check usage patterns
   - Update rate limits if needed

2. Quarterly Tasks:
   - Rotate API keys
   - Review RLS policies
   - Update emergency contacts

## 🚨 Security Contacts

Maintain a list of emergency contacts:
- Security Team Lead
- Database Administrator
- DevOps Engineer
- Supabase Support
- Stripe Support

---

**Note:** Keep this guide updated with your specific security implementations and emergency procedures.