# Deployment Configuration

## Environment Variables

Required environment variables for deployment:

```bash
# Base configuration
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Supabase configuration
PUBLIC_SUPABASE_URL=your-project-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API configuration
AI_SUMMARY_MONTHLY_LIMIT=5

# Monitoring configuration
ALERT_ERROR_RATE_THRESHOLD=0.05
ALERT_WEBHOOK_URL=your-alert-webhook
```

## Deployment Steps

### Staging Environment

1. Set environment variables:

   ```bash
   export NODE_ENV=staging
   export PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
   # ... set other variables
   ```

2. Run smoke tests:

   ```bash
   npm run test:smoke
   ```

3. Deploy to staging:

   ```bash
   npm run build
   npm run start
   ```

4. Verify deployment:
   - Check monitoring dashboard
   - Verify error rate alerts
   - Test AI summary generation
   - Monitor resource usage

### Production Environment

1. Set environment variables:

   ```bash
   export NODE_ENV=production
   export PUBLIC_SUPABASE_URL=https://production-project.supabase.co
   # ... set other variables
   ```

2. Run smoke tests:

   ```bash
   npm run test:smoke
   ```

3. Deploy to production:

   ```bash
   npm run build
   npm run start
   ```

4. Post-deployment verification:
   - Monitor error rates
   - Check API metrics
   - Verify authentication
   - Test AI generation limits
   - Monitor database performance

## Rollback Procedure

If issues are detected after deployment:

1. Revert to previous version:

   ```bash
   git checkout previous-tag
   npm run build
   npm run start
   ```

2. Verify rollback:
   - Check API functionality
   - Monitor error rates
   - Verify data consistency

## Monitoring Checklist

- [ ] Error rate < 1%
- [ ] Response time < 500ms
- [ ] AI generation limits enforced
- [ ] Authentication working
- [ ] Database connections stable
