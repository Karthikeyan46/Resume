import re
import json
import os
import sys

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)
import database

def import_all():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    seed_path = os.path.join(base_dir, "db", "seed.sql")

    conn = database.get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT LOWER(title) as t FROM items")
    existing_titles = set(r["t"].strip() for r in cursor.fetchall())

    with open(seed_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract all tuples inside INSERT INTO
    values_idx = content.find("values")
    if values_idx == -1:
        print("Values not found in seed.sql")
        return

    tuples_block = content[values_idx + len("values"):content.rfind(";")]
    lines = tuples_block.strip().split("\n")

    added = 0
    for line in lines:
        line = line.strip()
        if not line.startswith("(") or line.startswith("--"):
            continue
        line = line.rstrip(",").rstrip(";")
        
        # Parse SQL row: (uid, 'kind', 'title', 'venue', meta, year, link, 'icon', image_url, is_public, sort_order, array['seed'])
        # Use simple regex
        m = re.match(r"^\(\s*uid\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,\s*'([^']+)'", line)
        if m:
            kind = m.group(1).strip()
            title = m.group(2).replace("''", "'").strip()
            venue_raw = m.group(3).strip()
            meta_raw = m.group(4).strip()
            year_raw = m.group(5).strip()
            link_raw = m.group(6).strip()
            icon = m.group(7).strip()

            if title.lower() in existing_titles:
                continue

            venue = venue_raw.strip("'") if venue_raw != "null" else None
            meta = meta_raw.strip("'") if meta_raw != "null" else None
            year = int(year_raw) if year_raw.isdigit() else None
            link = link_raw.strip("'") if link_raw != "null" else None

            # Category mapping
            if kind == "conference":
                cat = "conference"
            elif kind == "journal":
                cat = "journal"
            elif kind in ("fdp", "workshop"):
                cat = "fdp"
            elif kind == "course":
                cat = "course"
            elif kind == "chapter":
                cat = "book_chapter"
            elif kind == "book":
                cat = "book"
            elif kind == "patent":
                cat = "patent"
            elif kind == "membership":
                cat = "membership"
            elif kind == "role":
                cat = "role"
            else:
                cat = "other"

            tags = [kind.capitalize()]
            if venue and "ieee" in venue.lower():
                tags.append("IEEE")
            if venue and "springer" in venue.lower():
                tags.append("Springer")
            if venue and "crc" in venue.lower():
                tags.append("CRC Press")
            if cat == "conference":
                tags.append("Conference")

            cursor.execute("""
            INSERT INTO items (
                category, subcategory, title, issuer_or_org, year, score_or_grade,
                url, tags, description, file_path, file_name, file_size
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                cat,
                kind.title(),
                title,
                venue,
                year,
                meta,
                link,
                json.dumps(tags),
                f"Published / Presented at {venue}" if venue else "Academic credential",
                None,
                None,
                0
            ))
            added += 1
            existing_titles.add(title.lower())

    conn.commit()
    conn.close()

    print(f"Added {added} records from seed.sql. Total records now: {database.get_stats()['total_items']}")

if __name__ == "__main__":
    import_all()
