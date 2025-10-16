# Housekeeping Jobs Documentation

## Overview

Automated maintenance jobs that run daily to keep the database clean and performant.

## Jobs

### 1. Tracker Cleanup
**Schedule**: Daily at 3:00 AM
**Action**: Delete tracker records older than 1 day
**Reason**: Trackers are real-time data and become stale quickly

```javascript
// Deletes trackers where createdAt < (now - 24 hours)
```

### 2. Chat Message Cleanup (Age-based)
**Schedule**: Daily at 3:00 AM
**Action**: Delete chat messages older than 1 month
**Reason**: Keep chat history manageable

```javascript
// Deletes messages where createdAt < (now - 30 days)
```

### 3. Chat Message Cleanup (Count-based)
**Schedule**: Daily at 3:00 AM
**Action**: Keep only the latest 3000 chat messages
**Reason**: Hard limit to prevent unbounded growth

```javascript
// If total > 3000, delete oldest messages beyond 3000
```

## Implementation

### Files Created

1. **src/jobs/housekeeping.js**
   - Main housekeeping logic
   - Individual cleanup functions
   - Cron scheduler
   - Manual trigger support

2. **src/index.js** (modified)
   - Import housekeeping module
   - Schedule jobs on server start
   - Add manual trigger endpoint

### Dependencies

- `node-cron`: Job scheduler (installed via `npm install node-cron`)
- `@prisma/client`: Database operations

## Usage

### Automatic Execution

Jobs run automatically every day at 3:00 AM when the server is running.

```
✅ [Housekeeping] Scheduled to run daily at 3:00 AM
```

### Manual Trigger

For testing or immediate cleanup:

**API Endpoint:**
```bash
POST http://localhost:8080/api/housekeeping/run
```

**Response:**
```json
{
  "success": true,
  "duration": 123,
  "trackersDeleted": 45,
  "oldChatsDeleted": 12,
  "excessChatsDeleted": 100
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:8080/api/housekeeping/run
```

## Configuration

### Change Schedule

Edit `src/jobs/housekeeping.js`:

```javascript
// Current: Daily at 3:00 AM
cron.schedule('0 3 * * *', async () => { ... });

// Examples:
// Every 6 hours: '0 */6 * * *'
// Every Sunday at midnight: '0 0 * * 0'
// Every hour: '0 * * * *'
```

### Change Retention Periods

**Trackers (default: 1 day)**
```javascript
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
// Change to 12 hours: - 12 * 60 * 60 * 1000
// Change to 2 days: - 48 * 60 * 60 * 1000
```

**Chat Messages (default: 1 month)**
```javascript
const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
// Change to 2 weeks: - 14 * 24 * 60 * 60 * 1000
// Change to 3 months: - 90 * 24 * 60 * 60 * 1000
```

**Chat Message Limit (default: 3000)**
```javascript
take: 3000
// Change to 5000: take: 5000
// Change to 1000: take: 1000
```

## Monitoring

### Logs

Housekeeping jobs log all operations:

```
[Housekeeping] Starting housekeeping tasks...
[Housekeeping] Deleted 45 tracker records older than 1 day
[Housekeeping] Deleted 12 chat messages older than 1 month
[Housekeeping] Deleted 100 chat messages to maintain 3000 limit (total was 3100)
[Housekeeping] Completed in 123ms. Summary:
  - Trackers deleted: 45
  - Old chats deleted: 12
  - Excess chats deleted: 100
```

### Error Handling

Errors are caught and logged but don't crash the server:

```
[Housekeeping] Error cleaning up trackers: P2002...
[Housekeeping] Failed: Database connection error
```

## Testing

### Test Locally

1. Start the server
2. Create some test data (old trackers, many chats)
3. Trigger manually:
   ```bash
   curl -X POST http://localhost:8080/api/housekeeping/run
   ```
4. Check the console output
5. Verify database records were deleted

### Test Scheduled Job

To test without waiting for 3 AM:

1. Temporarily change schedule in `housekeeping.js`:
   ```javascript
   // Test: Run every minute
   cron.schedule('* * * * *', async () => { ... });
   ```
2. Restart server
3. Wait for the next minute
4. Check console for execution logs
5. Revert schedule when done

## Security Note

**Important**: The manual trigger endpoint (`/api/housekeeping/run`) currently has no authentication. For production:

1. Add authentication middleware
2. Restrict to ADMIN role only
3. Or remove the endpoint entirely if not needed

```javascript
// Example with auth:
app.post('/api/housekeeping/run',
  authRequired,
  authorizeRole('ADMIN'),
  async (req, res) => { ... }
);
```

## Database Impact

- **Trackers**: Minimal impact, deletes are fast (indexed by createdAt)
- **Chat Messages**: Larger impact if many messages (consider running during off-peak hours)
- **Execution Time**: Typically < 1 second for normal loads

## Future Enhancements

Possible improvements:

1. Add email notifications for job results
2. Store job execution history in database
3. Configurable schedules via admin panel
4. Metrics dashboard for deleted records over time
5. Soft deletes instead of hard deletes
6. Archive old data before deletion
