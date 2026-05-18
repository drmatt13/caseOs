# CaseOS demo seed set

This folder is intentionally demo-oriented. It mirrors the user exported in
`data-1778874971407.csv` and gives you spreadsheet-friendly rows for a finished
workspace prototype.

Primary demo user id:

```txt
5bdbb6c2-877a-4772-ad9e-00a10d6073b5
```

Suggested import order:

1. `workspaces.csv`
2. `workspace_memberships.csv`
3. `cases.csv`
4. `case_documents.csv`
5. `case_records.csv`
6. `case_views.csv`

The frontend route currently uses matching in-memory demo data so you can roll
back freely without needing the database import to succeed.
