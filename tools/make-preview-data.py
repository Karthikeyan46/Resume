#!/usr/bin/env python3
"""
Generate assets/js/preview-data.js from db/seed.sql.

Why this exists
---------------
The portfolio reads its content from Supabase. Before you have connected a
project — or when you just want to look at a layout change offline — the page
would come up empty. This script converts the seed rows into a small JavaScript
file that index.js loads **only when the page is served from localhost**.

It is generated, never hand-edited, and it is git-ignored: it is a local
preview aid, not a second copy of your content.

Usage:
    python tools/make-preview-data.py
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'db', 'seed.sql')
OUT = os.path.join(ROOT, 'assets', 'js', 'preview-data.js')

COLUMNS = ['kind', 'title', 'venue', 'meta', 'year', 'link',
           'icon', 'image_url', 'is_public', 'sort_order']


def split_values(line):
    """Split a SQL tuple on commas that are not inside a quoted string."""
    parts, cur, in_str = [], '', False
    i = 0
    while i < len(line):
        c = line[i]
        if c == "'":
            if in_str and i + 1 < len(line) and line[i + 1] == "'":
                cur += "''"
                i += 1
            else:
                in_str = not in_str
            cur += c
        elif c == ',' and not in_str:
            parts.append(cur.strip())
            cur = ''
        else:
            cur += c
        i += 1
    parts.append(cur.strip())
    return parts


def parse(value):
    if value == 'null':
        return None
    if value in ('true', 'false'):
        return value == 'true'
    if value.startswith("'"):
        return value[1:-1].replace("''", "'")
    try:
        return int(value)
    except ValueError:
        return value


def main():
    if not os.path.exists(SEED):
        sys.exit('db/seed.sql not found')

    sql = open(SEED, encoding='utf-8').read()
    rows = []
    for m in re.finditer(r"^\s{4}\(uid, (.+), array\['seed'\]\)[,;]$", sql, re.M):
        values = [parse(v) for v in split_values(m.group(1))]
        if len(values) != len(COLUMNS):
            sys.exit('seed row has %d values, expected %d:\n%s'
                     % (len(values), len(COLUMNS), m.group(0)[:120]))
        row = dict(zip(COLUMNS, values))
        row['id'] = 'preview-%d' % len(rows)
        rows.append(row)

    if not rows:
        sys.exit('no seed rows matched — has the seed format changed?')

    banner = ('/* GENERATED FILE — do not edit.\n'
              '   Source: db/seed.sql   Regenerate: python tools/make-preview-data.py\n'
              '   Loaded only when the site is served from localhost, so the page has\n'
              '   something to show before Supabase is connected. */\n')
    body = 'window.PREVIEW_RECORDS = %s;\n' % json.dumps(rows, indent=2, ensure_ascii=False)
    open(OUT, 'w', encoding='utf-8').write(banner + body)

    kinds = {}
    for r in rows:
        kinds[r['kind']] = kinds.get(r['kind'], 0) + 1
    print('wrote %s' % os.path.relpath(OUT, ROOT))
    print('%d records: %s' % (len(rows), ', '.join(
        '%s %s' % (v, k) for k, v in sorted(kinds.items(), key=lambda x: -x[1]))))


if __name__ == '__main__':
    main()
