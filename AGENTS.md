<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Supabase migrations — tell the user immediately

Whenever a change depends on a new or updated SQL migration:

1. **Say so up front** in the same response that introduces the feature (not only buried in a PR note).
2. Name the file (e.g. `supabase/story-progress-migration.sql`) and that they must run it in the Supabase SQL Editor.
3. Do not leave them debugging “why isn’t this working?” — assume production has not applied the migration until they confirm.
