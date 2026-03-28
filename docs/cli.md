# CLI Tools

The Waitless binary includes built-in CLI commands for administration.

## Usage

```bash
./waitless <command> [args]
```

If no command is given, the HTTP server starts (same as `./waitless serve`).

---

## List Users

```bash
./waitless users
```

Prints a table of all registered users:
```
ID            EMAIL              NAME         ROLE    CREATED
──            ─────              ────         ────    ───────
iVPcvDYolPQy  admin@example.com  Admin User   admin   2026-03-28 20:00
AbPjb8GbmjcJ  user@example.com   Regular User user    2026-03-28 21:15

Total: 2 users
```

---

## Reset Password

```bash
./waitless reset-password <email>
```

Finds the user by email, prompts for a new password, and updates it. All active sessions are invalidated.

```
User: Admin User (admin@example.com) [admin]
New password (min 8 chars): ********
✅ Password reset for admin@example.com. All sessions invalidated.
```

---

## Database Backup

```bash
./waitless backup <output-file.sql>
```

Runs `pg_dump` using the `DATABASE_URL` environment variable.

```
Backing up to backup.sql...
✅ Backup saved to backup.sql
```

---

## Database Restore

```bash
./waitless restore <input-file.sql>
```

Restores from a SQL dump file. Prompts for confirmation before overwriting.

```
⚠️  This will overwrite the current database. Continue? [y/N]: y
Restoring from backup.sql...
✅ Database restored from backup.sql
```

> [!CAUTION]
> Restore overwrites all existing data. Always backup first.

---

## Environment

All CLI commands load `.env` automatically. Required:
- `DATABASE_URL` — PostgreSQL connection string
- `ENCRYPTION_KEY` — for encrypted fields (SMTP passwords)
