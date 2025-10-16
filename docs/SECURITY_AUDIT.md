# Security Audit Report

## Summary

This document analyzes the security posture of TosmTracker Reborn and identifies vulnerabilities and protection mechanisms.

## ✅ Protections Already in Place

### 1. SQL Injection Protection
**Status**: ✅ **PROTECTED**

- **Using Prisma ORM**: All database queries use Prisma, which uses parameterized queries
- **No raw SQL**: All queries are type-safe and automatically escaped
- **Example**:
  ```javascript
  // Safe - Prisma automatically parameterizes
  await prisma.tracker.findMany({
    where: { userId: req.user.id }
  })
  ```

### 2. Authentication & Authorization
**Status**: ✅ **MOSTLY PROTECTED**

**Protected Endpoints**:
- ✅ POST `/trackers` - EDITOR, ADMIN only
- ✅ PATCH `/trackers/:id` - EDITOR, ADMIN only
- ✅ DELETE `/trackers/:id` - EDITOR, ADMIN only
- ✅ POST `/episodes` - EDITOR, ADMIN only
- ✅ POST `/maps` - EDITOR, ADMIN only
- ✅ POST `/chat/send` - CHATTER, EDITOR, ADMIN only
- ✅ DELETE `/chat/:id` - Authenticated users only
- ✅ PATCH `/profile` - Authenticated users only
- ✅ GET `/users` - ADMIN only
- ✅ PATCH `/users/:id/role` - ADMIN only

**Unprotected Endpoints** (intentionally public):
- ℹ️ GET `/trackers` - Public (read-only)
- ℹ️ GET `/episodes` - Public (read-only)
- ℹ️ GET `/maps` - Public (read-only)
- ℹ️ GET `/chat/messages` - Public (read-only)

### 3. Password Security
**Status**: ✅ **PROTECTED**

- **Bcrypt hashing**: Passwords hashed with bcrypt (10 rounds)
- **Never returned**: Passwords excluded from API responses
- **Secure comparison**: Uses bcrypt.compare for timing-attack resistance

### 4. CORS Protection
**Status**: ✅ **CONFIGURED**

```javascript
cors({
  origin: CORS_ORIGIN, // Configured via .env
  credentials: true
})
```

### 5. Security Headers
**Status**: ✅ **CONFIGURED**

- **Helmet.js**: Content Security Policy, XSS Protection, etc.
- **CSP configured** for Socket.io and Vue I18n

### 6. Input Validation
**Status**: ✅ **PROTECTED**

- **Zod schemas**: All inputs validated before processing
- **Type safety**: TypeScript-style validation
- **Examples**:
  ```javascript
  CreateTracker.safeParse(req.body)
  UpdateTracker.safeParse(req.body)
  RegisterSchema.safeParse(req.body)
  ```

### 7. JWT Token Security
**Status**: ✅ **PROTECTED**

- **Signed tokens**: JWT with secret key
- **Token verification**: All protected routes verify tokens
- **No token exposure**: Stored securely on client

### 8. Socket.io Authentication
**Status**: ✅ **PROTECTED**

- **Token-based auth**: Validates JWT on connection
- **User context**: Socket bound to authenticated user
- **Permission checks**: Role-based checks for socket events

## ⚠️ Security Issues Found

### 1. **CRITICAL**: Housekeeping Endpoint Has No Auth
**Severity**: 🔴 HIGH

**Issue**:
```javascript
// Current - ANYONE can trigger housekeeping!
app.post('/api/housekeeping/run', async (req, res) => { ... })
```

**Risk**:
- Malicious users could trigger database deletions
- DoS by repeatedly calling expensive operations
- Data loss

**Fix Required**: See recommendations below

### 2. **MEDIUM**: Rate Limiting Not Implemented
**Severity**: 🟡 MEDIUM

**Issue**: No rate limiting on any endpoints

**Risk**:
- Brute force attacks on login
- API abuse / DoS
- Resource exhaustion

**Recommendation**: Add rate limiting middleware

### 3. **LOW**: Socket Reconnection Could Be Abused
**Severity**: 🟢 LOW

**Issue**: No rate limit on socket connections

**Risk**:
- Connection spam could overload server
- Minor DoS vector

**Mitigation**: Already has JWT validation, low priority

### 4. **INFO**: Error Messages May Leak Info
**Severity**: ℹ️ INFO

**Issue**: Some error messages expose internal details

**Example**:
```javascript
res.status(500).json({ error: err.message })
```

**Risk**: Information disclosure
**Recommendation**: Generic error messages in production

## 🛠️ Recommended Fixes

### Priority 1: Secure Housekeeping Endpoint

**Option A**: Add authentication (recommended)
```javascript
import { authRequired, authorizeRole } from './middleware/auth.js';

app.post('/api/housekeeping/run',
  authRequired,
  authorizeRole('ADMIN'),
  async (req, res) => { ... }
);
```

**Option B**: Remove endpoint entirely (if not needed)
```javascript
// Remove from index.js, rely only on scheduled jobs
```

**Option C**: Use secret token
```javascript
app.post('/api/housekeeping/run', (req, res, next) => {
  const token = req.headers['x-housekeeping-token'];
  if (token !== process.env.HOUSEKEEPING_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, async (req, res) => { ... });
```

### Priority 2: Add Rate Limiting

Install `express-rate-limit`:
```bash
npm install express-rate-limit
```

Add to `index.js`:
```javascript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});
app.use('/api/', apiLimiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### Priority 3: Sanitize Error Messages

Create error handler middleware:
```javascript
// In production, hide details
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      error: 'An error occurred'
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack
    });
  }
});
```

## 🔒 Additional Security Recommendations

### 1. Environment Variables
- ✅ Already using .env for secrets
- ✅ JWT_SECRET configured
- ✅ DATABASE_URL not exposed
- ⚠️ Consider adding HOUSEKEEPING_SECRET

### 2. HTTPS/TLS
- ⚠️ Not configured (use reverse proxy like nginx)
- Recommendation: Use Let's Encrypt in production
- Cookie settings should include `secure: true` for HTTPS

### 3. Security Headers (Additional)
```javascript
helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
})
```

### 4. Input Sanitization
- ✅ Already handled by Zod validation
- Consider adding HTML sanitization for chat messages
```javascript
import DOMPurify from 'isomorphic-dompurify';
const cleanContent = DOMPurify.sanitize(content);
```

### 5. Logging & Monitoring
- ✅ Basic logging in place
- Consider structured logging (winston, pino)
- Add request ID tracking
- Monitor failed auth attempts

### 6. Database Security
- ✅ Prisma connection pooling
- ✅ Prepared statements (via Prisma)
- Consider read replicas for scaling
- Regular backups

### 7. Session Management
- ✅ JWT-based (stateless)
- Consider token expiration/refresh
- Add token blacklist for logout
- Consider short-lived tokens with refresh tokens

## 🎯 Security Checklist

### Immediate Actions (Do Now)
- [ ] Secure housekeeping endpoint with ADMIN auth
- [ ] Add rate limiting to login/register
- [ ] Review and sanitize error messages
- [ ] Add HOUSEKEEPING_SECRET to .env

### Short Term (This Week)
- [ ] Add rate limiting to all API routes
- [ ] Implement request logging with IDs
- [ ] Add HTML sanitization for chat
- [ ] Document security policies

### Long Term (This Month)
- [ ] Set up HTTPS/TLS
- [ ] Implement token refresh mechanism
- [ ] Add security monitoring/alerts
- [ ] Conduct penetration testing
- [ ] Set up automated security scanning

## 📚 Security Best Practices

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Environment Separation**
   - Never commit .env files
   - Use different secrets per environment
   - Separate dev/staging/prod databases

3. **Regular Audits**
   - Review access logs monthly
   - Check for suspicious activity
   - Update dependencies quarterly

4. **Incident Response Plan**
   - Document what to do if breached
   - Have database backup/restore procedure
   - Know how to revoke compromised tokens

## 🔍 Testing Security

### Test SQL Injection (Should Fail)
```bash
# Try to inject SQL in tracker creation
curl -X POST http://localhost:8080/api/trackers \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"mapId": "1; DROP TABLE trackers--"}'
# Result: Should fail validation, not execute SQL
```

### Test Auth Bypass (Should Fail)
```bash
# Try to access protected route without token
curl -X POST http://localhost:8080/api/trackers
# Result: 401 Unauthorized
```

### Test Rate Limiting (After Implementation)
```bash
# Send 10 rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/auth/login
done
# Result: Should get rate limited after 5
```

## 📞 Security Contact

If security vulnerabilities are discovered:
1. Do NOT open public issues
2. Email: [security contact needed]
3. Include: Description, reproduction steps, impact
4. Responsible disclosure: 90 day timeline

## Conclusion

**Overall Security Level**: 🟡 GOOD with Critical Fix Needed

The application has solid foundational security:
- ✅ SQL injection protected
- ✅ Authentication/authorization working
- ✅ Input validation comprehensive
- ✅ Password security strong

**Critical issue requiring immediate attention:**
- 🔴 Housekeeping endpoint needs authentication

**Recommended improvements:**
- 🟡 Add rate limiting
- 🟢 Enhanced error handling
- 🟢 Additional security headers

Once the housekeeping endpoint is secured, the application will have strong security posture suitable for production deployment.
