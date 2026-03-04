# Prevent Cohort-Programme Mismatch

## Problem

The current issue where cohort `PROG-2026-B88GLO` is associated with the wrong programme CAN happen again because:

1. **No Visual Confirmation**: When creating a cohort, conveners don't see which programme they're creating it for
2. **Easy Navigation Mistakes**: Conveners could navigate to the wrong programme page and create a cohort there
3. **No Confirmation Step**: There's no "Are you sure?" step showing the programme-cohort relationship
4. **Manual Database Edits**: Direct database modifications without proper validation

## How It Can Happen Again

### Scenario 1: Wrong Programme Page
1. Convener opens Programme A
2. Gets distracted, navigates to Programme B
3. Clicks "Create Cohort" thinking they're still on Programme A
4. Creates cohort under Programme B by mistake

### Scenario 2: Multiple Tabs
1. Convener has multiple programme tabs open
2. Creates cohort in the wrong tab
3. Doesn't realize until users start enrolling

### Scenario 3: Direct Database Manipulation
1. Someone manually updates the database
2. Accidentally changes a cohort's `programme_id`
3. No validation catches the error

## Prevention Solutions

### Solution 1: Add Programme Context to Cohort Form (IMMEDIATE)

Update the cohort creation page to clearly show which programme the cohort is being created for.

**Changes needed:**
- Display programme name prominently at the top of the form
- Add programme ID to the form for reference
- Show a warning if the programme doesn't exist

### Solution 2: Add Confirmation Step (RECOMMENDED)

Before creating the cohort, show a confirmation dialog:

```
You are creating a cohort for:
Programme: [Programme Name]
Cohort Name: [Cohort Name]
Enrollment Code: [Code]

This cohort will be permanently associated with this programme.
Are you sure you want to continue?
```

### Solution 3: Database Foreign Key Constraints (CRITICAL)

Add proper foreign key constraints to prevent orphaned or invalid associations:

```sql
-- Add foreign key constraint if not exists
ALTER TABLE cohorts
ADD CONSTRAINT fk_cohorts_programme
FOREIGN KEY (programme_id) 
REFERENCES programmes(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;
```

This ensures:
- Cohorts can only reference existing programmes
- Programmes with cohorts cannot be deleted
- Programme ID updates cascade to cohorts

### Solution 4: Audit Trail (LONG-TERM)

Add logging for cohort creation and modifications:

```sql
CREATE TABLE cohort_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cohort_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_programme_id INT,
    new_programme_id INT,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cohort_id) REFERENCES cohorts(id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

### Solution 5: Validation Script (MAINTENANCE)

Create a script to regularly check for data integrity issues:

```sql
-- Find cohorts with invalid programme references
SELECT 
    c.id,
    c.name,
    c.enrollment_code,
    c.programme_id
FROM cohorts c
LEFT JOIN programmes p ON c.programme_id = p.id
WHERE p.id IS NULL;

-- Find cohorts with mismatched enrollment code patterns
-- (e.g., code suggests Programme A but linked to Programme B)
SELECT 
    c.id,
    c.name,
    c.enrollment_code,
    c.programme_id,
    p.name AS programme_name
FROM cohorts c
JOIN programmes p ON c.programme_id = p.id
WHERE c.enrollment_code NOT LIKE CONCAT('%', SUBSTRING(p.name, 1, 4), '%');
```

## Implementation Priority

### Phase 1: Immediate (Today)
1. ✅ Fix the current `PROG-2026-B88GLO` issue in database
2. ⬜ Add programme name display to cohort creation form
3. ⬜ Add database foreign key constraints

### Phase 2: Short-term (This Week)
4. ⬜ Add confirmation dialog before cohort creation
5. ⬜ Add programme context breadcrumbs throughout convener UI
6. ⬜ Create data integrity validation script

### Phase 3: Long-term (Next Sprint)
7. ⬜ Implement audit trail for cohort changes
8. ⬜ Add automated alerts for data integrity issues
9. ⬜ Create admin dashboard for cohort-programme relationships

## Code Changes Required

### 1. Update CohortForm Component

Add programme name display:

```typescript
interface CohortFormProps {
  programmeId: string;
  programmeName: string; // NEW: Add programme name
  onSubmit: (data: CohortFormData) => Promise<void>;
  onCancel: () => void;
}

export function CohortForm({
  programmeId,
  programmeName, // NEW
  onSubmit,
  onCancel,
}: CohortFormProps) {
  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* NEW: Programme Context Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-gray-700">
          Creating cohort for programme:
        </p>
        <p className="text-lg font-semibold text-gray-900">
          {programmeName}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Programme ID: {programmeId}
        </p>
      </div>
      
      {/* Rest of form... */}
    </form>
  );
}
```

### 2. Update Cohort Creation Page

Fetch and display programme name:

```typescript
export default function NewCohortPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  
  // NEW: Fetch programme details
  const [programme, setProgramme] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProgramme() {
      try {
        const data = await getProgrammeDetails(programmeId);
        setProgramme(data);
      } catch (error) {
        console.error('Failed to fetch programme:', error);
        // Redirect if programme doesn't exist
        router.push('/convener/dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchProgramme();
  }, [programmeId, router]);
  
  if (loading) return <div>Loading...</div>;
  if (!programme) return <div>Programme not found</div>;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb showing programme context */}
        <nav className="mb-4 text-sm text-gray-600">
          <a href="/convener/dashboard">Dashboard</a>
          {' > '}
          <a href={`/convener/programmes/${programmeId}`}>{programme.name}</a>
          {' > '}
          <span className="text-gray-900">Create Cohort</span>
        </nav>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Cohort
          </h1>
          
          <CohortForm
            programmeId={programmeId}
            programmeName={programme.name} // NEW
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
```

### 3. Add Database Constraint

Run this SQL migration:

```sql
-- Check if constraint already exists
SELECT CONSTRAINT_NAME 
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'cohorts' 
AND CONSTRAINT_TYPE = 'FOREIGN KEY'
AND CONSTRAINT_NAME = 'fk_cohorts_programme';

-- If not exists, add it
ALTER TABLE cohorts
ADD CONSTRAINT fk_cohorts_programme
FOREIGN KEY (programme_id) 
REFERENCES programmes(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;
```

## Testing the Fix

### Test 1: Visual Confirmation
1. Navigate to a programme
2. Click "Create Cohort"
3. Verify programme name is displayed prominently
4. Verify you can't accidentally create cohort for wrong programme

### Test 2: Database Constraint
1. Try to create a cohort with invalid `programme_id`
2. Should fail with foreign key constraint error
3. Try to delete a programme that has cohorts
4. Should fail with constraint error

### Test 3: Navigation Safety
1. Open multiple programme tabs
2. Create cohort in each
3. Verify each cohort is created under the correct programme

## Monitoring

After implementing these fixes, monitor for:
- Cohort creation errors (might indicate constraint violations)
- User feedback about confusion during cohort creation
- Database integrity check results

## Documentation

Update convener documentation to include:
- Clear instructions on cohort creation workflow
- Warning about programme-cohort relationship being permanent
- Steps to verify cohort is created under correct programme
- Contact info if they create a cohort under wrong programme

