# Portfolio + Private Vault — setup

Your site now has two halves that share **one** set of data:

| | |
|---|---|
| `index.html` | Public portfolio. Reads only the rows you marked *public*. |
| `vault.html` | Your private login. Upload certificates, keep files, download any time. |

One record per item. You add an FDP certificate once in the vault; tick
*Show on public portfolio* and it also appears in the Certifications section.
Nothing is stored twice, and nothing about publications or certificates is
hard-coded in `index.html` any more.

**Files always stay private.** Even for a public record, only the title, venue
and link go public — the PDF itself is reachable only through a signed link
that your browser requests after you log in, and that link expires in
2 minutes.

---

## One-time setup (about 15 minutes)

### 1. Create the Supabase project

Go to <https://supabase.com> → sign in with GitHub → **New project**.

- Name: `karthikeyan-portfolio`
- Database password: pick one and save it somewhere safe
- Region: **Mumbai / Singapore** (closest to you)
- Plan: **Free** — 500 MB database, 1 GB file storage, unlimited API calls

Wait ~2 minutes for it to provision.

### 2. Create the tables

Left sidebar → **SQL Editor** → **New query**.
Paste the entire contents of `db/schema.sql`, press **Run**.

You should see `Success. No rows returned`.

### 3. Create your login

Left sidebar → **Authentication** → **Users** → **Add user** → *Create new user*.

- Email: your email
- Password: pick a strong one
- Tick **Auto Confirm User**

### 4. Close the door behind you

Still in **Authentication** → **Sign In / Providers** → *Email*:

- Turn **OFF** "Allow new users to sign up"

This makes yours the only account that can ever exist.

### 5. Import your existing content

**SQL Editor** → **New query** → paste all of `db/seed.sql` → **Run**.

This loads the 57 items currently on your site: 21 conferences, 6 journals,
6 book chapters, 1 book, 1 patent, 4 FDPs, 4 courses, 2 workshops,
5 memberships and 7 institutional roles — all as public records.

Re-running it is safe — it replaces only the seeded rows and leaves anything
you added yourself alone.

### 6. Connect the site to the project

You need two values. The quickest way to get both: click the **Connect** button
at the top of your project dashboard — the URL and key are shown together,
ready to copy.

If you would rather dig through settings:

| Value | Where |
|---|---|
| Project URL | **Settings** → **Data API** → *Project URL* |
| Key | **Settings** → **API Keys** → *Publishable key* (starts `sb_publishable_`) |

Can't find the Project URL? You can build it yourself. Look at your dashboard
address bar — `.../dashboard/project/**uwucpestdhsctucjwdld**/settings/...` —
that middle code is your project ref, and the URL is simply
`https://<project-ref>.supabase.co`. It is not a secret; it appears in every
request the site makes.

If the API Keys page shows nothing, press **Create new API keys**. Older
projects instead have an *anon public* key under the **Legacy API keys** tab —
that works identically, but Supabase is phasing legacy keys out, so use the
publishable one if you have the choice.

Paste both into `assets/js/supabase-config.js`:

```js
window.SUPABASE_URL      = 'https://xxxxxxxxxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_xxxxxxxxxxxxxxxxxxxx';
```

That key is designed to be public and is safe in your GitHub repo — it grants
nothing by itself. Row Level Security decides what it can reach, which is only
the `public_records` view.

**Do not** use anything labelled *secret* or *service_role*. Those bypass every
policy in `db/schema.sql`, and in a browser file they would hand your whole
database to anyone who views source. The config file refuses a secret key and
logs an error if you paste one by mistake.

### 7. Allow password resets from your domain

**Authentication** → **URL Configuration**:

- Site URL: `https://karthikeyans.vercel.app`
- Redirect URLs: add both `https://karthikeyans.vercel.app/vault`
  and `https://karthikeyans.vercel.app/vault.html`

### 8. Stop the project from pausing

Supabase pauses Free-plan projects after about 7 days of low database activity.
Nothing is deleted — you press *Restore* and it comes back in minutes — but
one-click restore is disabled after **90 days paused**, and past that you are
rebuilding from a backup by hand.

Visits to your portfolio already reset that timer, because every page load
queries the database. `.github/workflows/keepalive.yml` covers the quiet weeks
by running one query a day.

To arm it: GitHub → your repo → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**, twice:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | the anon / public key |

Then **Actions** → *Keep Supabase awake* → **Run workflow** to test it now. A
green tick means the ping worked. If it ever fails, the job fails and GitHub
emails you — that alert is the point of it.

The workflow also writes one tiny commit on the 1st of each month, because
GitHub switches off scheduled workflows in a repository that has seen no
activity for 60 days.

### 9. Deploy

```bash
git add .
git commit -m "Add private vault backed by Supabase; make publications and certifications data-driven"
git push
```

Vercel redeploys automatically. Your vault is then at
<https://karthikeyans.vercel.app/vault.html>.

---

## Record types

Sixteen types, in four bands. The band decides where a record can appear.

| Type | Where it shows publicly |
|---|---|
| **FDP** | Certifications & Faculty Development |
| **Workshop / seminar / webinar** | Certifications & Faculty Development |
| **Course / MOOC** | Certifications & Faculty Development |
| **Certificate (generic)** | Certifications & Faculty Development |
| **Journal** | Research & Publications |
| **Conference** | Research & Publications |
| **Book chapter** | Research & Publications |
| **Book** | Research & Publications |
| **Patent** | Research & Publications |
| **Professional membership** | Professional Memberships |
| **Institutional role** | Roles & Responsibilities |
| **Education certificate** | never — vault only |
| **Employment letter** | never — vault only |
| **Teaching material** | never — vault only |
| **Miscellaneous** | never — vault only |
| **Other / proof** | never — vault only |

The last five are blocked in two places: the vault greys out the publish
toggle, and the database rejects the row outright through the
`publishable_kinds_only` constraint. Even a mis-click cannot leak an
appointment letter onto your homepage.

Nothing is published just because its type allows it — every record still needs
its own tick.

**Not sure where something goes?** Put it in *Miscellaneous*. It stays private
and searchable, and you can reclassify it in ten seconds later. Filing
paralysis is the reason certificates go missing in the first place.

**Membership logos.** A membership card shows a logo from the *Logo image*
field, e.g. `assets/img/iste-logo.jpg`. For a new society, drop the logo into
`assets/img/` and put that path in the field.

---

## Day-to-day use

**Finding things.** The vault opens on folders, grouped into the four bands
above — *FDP*, *Degree certificates*, *Memberships* and so on. Each tile shows
how many items it holds and how many are still missing their file. Click a
folder to see its records, **← Folders** to come back, or *Show all records*
for the flat list. Search and the file/visibility filters work inside whichever
folder you are standing in.

**You finish an FDP and get the certificate.**

1. Open `/vault.html`, sign in.
2. Fill the form: title, type *FDP*, issuing body, year.
3. Attach the PDF.
4. Tick *Show on public portfolio* if it belongs on the site. Leave it
   unticked for anything you only want in your own records.
5. Save. Done — it is in both places, stored once.

**Backlog of old certificates.** Drag the whole pile onto the *Bulk drop* box.
Each file becomes a private draft with the filename as its title; edit them at
your leisure. Use the **Missing file** filter to find records where you still
need to hunt down the PDF.

**Getting a certificate back later.** Sign in, search, press **⬇ Download**.

**Backup.** The **⬇ Backup** button downloads a JSON copy of every record's
metadata. Worth doing once a term.

---

## Notes and limits

- Free tier gives 1 GB of file storage and a 50 MB per-file cap. A scanned
  certificate is usually 100–500 KB, so that is a few thousand certificates.
- Pausing is handled by step 8. Worth knowing anyway: a paused project is
  frozen, not deleted, and restores in minutes — but only for the first 90
  days, after which you restore from a backup by hand. Keep your original
  certificate files on your own disk too; the vault is for retrieval, not as
  your only copy.
- The public page fetches its content with JavaScript and caches the last good
  response in the visitor's browser, so a returning visitor still sees your
  work even if the database is briefly unreachable. Google renders JavaScript
  when indexing, but a purely static page would still be marginally better for
  SEO — the trade-off you accepted in exchange for having no duplicate lists.
- Four public sections are now data-driven: Publications, Certifications,
  Professional Memberships and Roles & Responsibilities. *UG Projects Mentored*
  is still written by hand in `index.html` — say the word and it can move too.
- Adding a type later (say, *Awards* or *Invited talks*) means four small
  edits: the `kind` check and the `publishable_kinds_only` list in
  `db/schema.sql`, a line in `CERT_KINDS` or `PUB_SECTIONS` in
  `assets/js/index.js`, and an `<option>` in the two dropdowns in `vault.html`.

## Files added or changed

```
index.html                     public portfolio
vault.html                     private vault (login required)
assets/css/index.css           site styles
assets/css/vault.css           vault styles
assets/js/index.js             renders publications + certifications from public_records
assets/js/vault.js             vault logic: auth, upload, signed-URL download
assets/js/supabase-config.js   your project URL + anon key  <- you fill this in
assets/img/                    profile photo, book cover, society logos
assets/docs/                   resume
db/schema.sql                  tables, row-level security, private storage bucket
db/seed.sql                    your current 45 items, ready to import
vercel.json                    redirects that keep old asset URLs alive
_archive/                      old agent screenshots and scratch files (not deployed)
```
