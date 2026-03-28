#!/usr/bin/env python3
"""Read Cursor ItemTable auth fields from state.vscdb (read-only URI mode). Prints JSON to stdout."""
import json
import sqlite3
import sys
from pathlib import Path

KEYS = (
    "cursorAuth/cachedEmail",
    "cursorAuth/stripeMembershipType",
    "cursorAuth/stripeSubscriptionStatus",
    "cursorAuth/cachedSignUpType",
)


def main() -> None:
    if len(sys.argv) != 2:
        print("{}", flush=True)
        sys.exit(1)
    db_path = sys.argv[1]
    try:
        uri = Path(db_path).expanduser().resolve().as_uri() + "?mode=ro"
        conn = sqlite3.connect(uri, uri=True)
        cur = conn.cursor()
        placeholders = ",".join("?" * len(KEYS))
        cur.execute(f"SELECT key, value FROM ItemTable WHERE key IN ({placeholders})", KEYS)
        out: dict[str, str | None] = {}
        for key, value in cur.fetchall():
            if value is None:
                out[key] = None
            elif isinstance(value, bytes):
                out[key] = value.decode("utf-8", errors="replace")
            else:
                out[key] = str(value)
        conn.close()
        print(json.dumps(out), flush=True)
    except OSError:
        print("{}", flush=True)
        sys.exit(2)
    except sqlite3.Error:
        print("{}", flush=True)
        sys.exit(3)


if __name__ == "__main__":
    main()
