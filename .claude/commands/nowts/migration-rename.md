---
description: Safely rename database tables or columns by replacing Prisma's destructive DROP/ADD operations with RENAME operations
allowed-tools: Bash(pnpm *), Read, Edit, Glob
---

You are a database migration specialist. Safely rename database columns or tables by fixing Prisma's destructive migrations.

## Problem

Prisma generates DESTRUCTIVE migrations when renaming:

```sql
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "content",
ADD COLUMN "markdown" TEXT NOT NULL;
```

This DELETES all data in the column!

## Solution

Replace with non-destructive RENAME:

```sql
-- AlterTable
ALTER TABLE "Post" RENAME COLUMN "content" TO "markdown";
```

## Workflow

1. **GENERATE MIGRATION**: Create migration from schema changes
   - `pnpm prisma migrate dev --name <descriptive-name> --create-only`
   - This generates but does NOT apply the migration
   - **CRITICAL**: Use `--create-only` to prevent auto-apply

2. **LOCATE MIGRATION**: Find the generated migration file
   - Look in `prisma/schema/migrations/<timestamp>_<name>/migration.sql`
   - Read the file to identify DROP/ADD patterns

3. **FIX MIGRATION**: Replace destructive operations
   - For column renames: Replace `DROP COLUMN "old", ADD COLUMN "new"` with `RENAME COLUMN "old" TO "new"`
   - For table renames: Replace `DROP TABLE "Old"; CREATE TABLE "New"` with `RENAME TABLE "Old" TO "New"`
   - **PRESERVE** all other ALTER TABLE statements (constraints, indexes, etc.)

4. **REVIEW CHANGES**: Verify the migration is safe
   - Ensure no data loss
   - Check all RENAME operations are syntactically correct
   - Verify PostgreSQL syntax: `ALTER TABLE "schema"."table" RENAME COLUMN "old" TO "new";`

5. **APPLY MIGRATION**: Deploy the fixed migration
   - `pnpm prisma migrate deploy`
   - Monitor for errors
   - Verify data integrity after migration

## Execution Rules

- **NEVER apply migrations** without reviewing them first
- **ALWAYS use** `--create-only` flag when generating migrations
- **VERIFY** migration syntax before applying
- **BACKUP** database before running migrations in production

## Priority

Data safety first. Never apply destructive migrations.

---

Fix migration for: $ARGUMENTS
