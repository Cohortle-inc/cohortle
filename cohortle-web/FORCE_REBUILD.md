# Force Clean Rebuild

The "Failed to find Server Action" error is caused by Docker build cache issues.

## Solution

In Coolify, you need to force a clean rebuild:

1. Go to your Coolify dashboard
2. Navigate to your cohortle-web application
3. Click on "Redeploy" 
4. **Enable "Force Rebuild Without Cache"** option
5. Deploy

This will:
- Clear all Docker build cache
- Rebuild from scratch
- Fix the Server Action mismatch error

## Alternative: Add .dockerignore

If the issue persists, ensure `.dockerignore` excludes:
```
.next
node_modules
.git
```

This prevents stale build artifacts from being copied into the Docker image.
