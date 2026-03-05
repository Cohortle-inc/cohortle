# Role System - Quick Reference Card

**Administrator:** `teamcohortle@gmail.com` (automatic)  
**Status:** Fully Automated ✅

---

## 🚀 Deployment

```bash
git push origin main
# That's it! Everything else is automatic.
```

---

## ✅ Verification

```bash
# Check logs for:
✅ Role system initialized successfully

# Test admin access:
# Log in as teamcohortle@gmail.com
```

---

## 🔧 Manual Commands (Optional)

```bash
npm run roles:init      # Initialize role system
npm run roles:verify    # Verify setup
npm run roles:assign    # Assign roles to users
npm run roles:admin     # Create administrator
```

---

## 📊 Roles

| Role | Level | Description |
|------|-------|-------------|
| student | 1 | Default for all users |
| convener | 2 | Programme creators |
| administrator | 3 | Platform admins |

---

## 🛠️ Troubleshooting

```bash
# If initialization fails:
npm run roles:init

# If admin not created:
npm run roles:admin teamcohortle@gmail.com

# If users don't have roles:
npm run roles:assign
```

---

## 📁 Key Files

- `cohortle-api/scripts/initialize-role-system.js` - Automation
- `cohortle-api/bin/www` - Startup integration
- `AUTOMATED_ROLE_SYSTEM_DEPLOYMENT.md` - Full docs

---

## 🎯 What Happens Automatically

1. ✅ Seeder runs (roles/permissions)
2. ✅ Users get roles (student)
3. ✅ Admin created (teamcohortle@gmail.com)
4. ✅ Verification runs

---

**No manual steps required!** 🎉
