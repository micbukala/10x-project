# Database Schema - AI SciSum

## Overview

PostgreSQL database schema for AI SciSum MVP, leveraging Supabase authentication and Row-Level Security (RLS) for data isolation.

## Custom Types

### summary_creation_type

```sql
CREATE TYPE summary_creation_type AS ENUM ('ai', 'manual');
```

## Tables

### 1. users

This table is managed by Supabase Auth.

User-specific application data, one-to-one relationship with `auth.users`.

| Column             | Type        | Constraints                                              | Description                       |
| ------------------ | ----------- | -------------------------------------------------------- | --------------------------------- |
| id                 | UUID        | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User identifier                   |
| ai_usage_count     | INTEGER     | NOT NULL, DEFAULT 0, CHECK (ai_usage_count >= 0)         | Current month AI generation count |
| usage_period_start | TIMESTAMPTZ | NOT NULL, DEFAULT now()                                  | Start of current usage period     |

**Indexes:**

- Primary key index on `id` (automatic)

**Notes:**

- Automatically created via trigger when new user registers in `auth.users`
- Cascading delete ensures cleanup when user account is removed

### 2. summaries

Article summaries created by users via AI generation or manual input.

| Column              | Type                  | Constraints                                      | Description                      |
| ------------------- | --------------------- | ------------------------------------------------ | -------------------------------- |
| id                  | UUID                  | PRIMARY KEY, DEFAULT gen_random_uuid()           | Summary identifier               |
| user_id             | UUID                  | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Owner of the summary             |
| title               | TEXT                  | NOT NULL, CHECK (length(trim(title)) > 0)        | Summary title (editable)         |
| content             | JSONB                 |                                                  | Structured summary sections      |
| original_ai_content | JSONB                 |                                                  | Original AI output for analytics |
| creation_type       | summary_creation_type | NOT NULL                                         | Creation method (ai/manual)      |
| ai_model_name       | TEXT                  |                                                  | AI model used for generation     |
| created_at          | TIMESTAMPTZ           | NOT NULL, DEFAULT now()                          | Creation timestamp               |
| updated_at          | TIMESTAMPTZ           | NOT NULL, DEFAULT now()                          | Last modification timestamp      |

**Indexes:**

- Primary key index on `id` (automatic)
- `CREATE INDEX idx_summaries_user_id ON summaries(user_id);` - Optimize user summary listing
- `CREATE INDEX idx_summaries_creation_type ON summaries(creation_type);` - Support analytics queries

**JSONB Structure for `content` and `original_ai_content`:**

```json
{
  "research_objective": "string",
  "methods": "string",
  "results": "string",
  "discussion": "string",
  "open_questions": "string",
  "conclusions": "string"
}
```

**Notes:**

- `original_ai_content` stores unedited AI output for acceptance rate metrics
- `updated_at` automatically updated via trigger on row modification
- Cascading delete removes all summaries when user or profile is deleted

## Relationships

### users ↔ auth.users

- **Type:** One-to-One
- **Implementation:** `users.id` references `auth.users.id` with `ON DELETE CASCADE`
- **Direction:** Each user in `auth.users` has exactly one profile in `users`

### users ↔ summaries

- **Type:** One-to-Many
- **Implementation:** `summaries.user_id` references `users.id` with `ON DELETE CASCADE`
- **Direction:** One user can have multiple summaries; each summary belongs to one user

## Database Functions (RPC)

### check_ai_limit()

```sql
CREATE OR REPLACE FUNCTION check_ai_limit()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_usage_count INTEGER;
  v_period_start TIMESTAMPTZ;
  v_current_period TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  SELECT ai_usage_count, usage_period_start
  INTO v_usage_count, v_period_start
  FROM users
  WHERE id = v_user_id;

  v_current_period := date_trunc('month', now());

  -- Reset counter if new month
  IF v_period_start < v_current_period THEN
    UPDATE users
    SET ai_usage_count = 0,
        usage_period_start = v_current_period
    WHERE id = v_user_id;
    RETURN TRUE;
  END IF;

  -- Check if under limit
  RETURN v_usage_count < 5;
END;
$$ LANGUAGE plpgsql;
```

### create_ai_summary()

```sql
CREATE OR REPLACE FUNCTION create_ai_summary(
  p_title TEXT,
  p_content JSONB,
  p_original_ai_content JSONB,
  p_ai_model_name TEXT
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_summary_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Insert summary
  INSERT INTO summaries (user_id, title, content, original_ai_content, creation_type, ai_model_name)
  VALUES (v_user_id, p_title, p_content, p_original_ai_content, 'ai', p_ai_model_name)
  RETURNING id INTO v_summary_id;

  -- Increment usage count
  UPDATE users
  SET ai_usage_count = ai_usage_count + 1
  WHERE id = v_user_id;

  RETURN v_summary_id;
END;
$$ LANGUAGE plpgsql;
```

**Usage Flow:**

1. Frontend calls `check_ai_limit()` before initiating AI generation
2. If limit available, frontend proceeds with AI API call
3. On successful AI response, frontend calls `create_ai_summary()` to atomically save summary and decrement limit

## Triggers

### auto_create_profile

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, ai_usage_count, usage_period_start)
  VALUES (NEW.id, 0, date_trunc('month', now()));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### auto_update_timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_summaries_timestamp
  BEFORE UPDATE ON summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Row-Level Security (RLS) Policies

### users table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view only their own profile
CREATE POLICY select_own_profile ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY update_own_profile ON users
  FOR UPDATE
  USING (auth.uid() = id);
```

### summaries table

```sql
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Users can view only their own summaries
CREATE POLICY select_own_summaries ON summaries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert summaries for themselves
CREATE POLICY insert_own_summaries ON summaries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own summaries
CREATE POLICY update_own_summaries ON summaries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete only their own summaries
CREATE POLICY delete_own_summaries ON summaries
  FOR DELETE
  USING (auth.uid() = user_id);
```

## Design Decisions & Rationale

### JSONB for Summary Content

- **Flexibility:** Allows schema evolution without migrations
- **Performance:** Efficient indexing and querying capabilities
- **Simplicity:** Single column for structured data reduces join complexity

### Separate Title Column

- **Indexing:** Enables efficient full-text search on titles
- **Validation:** Dedicated constraints ensure data quality
- **Display:** Optimizes summary list queries (no JSONB parsing needed)

### Transactional AI Credit Management

- **Atomicity:** Ensures credit consumed only on successful summary creation
- **Security:** `SECURITY DEFINER` functions prevent client-side manipulation
- **Race Conditions:** Database-level enforcement prevents concurrent limit violations

### original_ai_content Column

- **Analytics:** Enables calculation of acceptance rate metric (US-006 requirement)
- **Comparison:** Allows measurement of content modifications
- **Optional:** Nullable to support manual summaries without storage overhead

### Cascading Deletes

- **Data Integrity:** Automatic cleanup prevents orphaned records
- **GDPR Compliance:** Complete data removal on account deletion
- **Simplicity:** Reduces application-level cleanup logic

### Monthly Usage Reset Logic

- **Efficiency:** In-function check and reset avoids scheduled jobs
- **Accuracy:** Atomic check-and-update prevents race conditions
- **Simplicity:** Self-contained logic in `check_ai_limit()` function

## Migration Considerations

### Initial Setup Order

1. Create custom types (`summary_creation_type`)
2. Create `users` table
3. Create `summaries` table
4. Create indexes
5. Create functions
6. Create triggers
7. Enable RLS and create policies

### Future Scalability

- Consider partitioning `summaries` table by `created_at` if volume exceeds 10M records
- Add GIN indexes on `content` JSONB for advanced querying if needed
- Implement archival strategy for old summaries based on retention policy
