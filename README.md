# Prof. Karthikeyan.S — Academic & Certificate Portfolio Vault

A complete, database-backed dashboard and portfolio vault to store, categorize, upload, search, preview, and retrieve all academic certificates, publications, patents, degrees, and career credentials.

Built with **Python Flask**, **SQLite Database (Local & Secure)**, **Tailwind CSS**, and **Lucide Icons**.

---

## 🚀 Quick Start (1-Click Run)

### Option 1: Double-Click Launcher (Windows)
Double-click **`run_dashboard.bat`** in this directory.  
It will automatically start the server and open the dashboard in your default browser at:  
👉 **`http://127.0.0.1:5050`**

### Option 2: Command Line
```bash
python app.py
```
Then open <http://127.0.0.1:5050> in your browser.

---

## 🗂️ Categorization Structure

The database (`portfolio.db`) organizes all records into structured categories with tailored metadata fields:

| Category | Typical Records & Metadata |
|---|---|
| 🏫 **School Education** | 10th (Matriculation), 12th (Higher Secondary), Board Marksheets, Rank Certificates |
| 🎓 **College & Degrees** | B.E. / B.Tech, M.E. / M.Tech, Ph.D., Degrees, Transcripts & Provisional Certificates |
| 🏆 **Academic Honors** | Scholarships, Dean's List, University Ranks, Medals & Academic Excellence Awards |
| 🎤 **Conferences** | IEEE, Springer, International & National Conference Papers & Presentation Certificates |
| 📗 **Journals** | Scopus, SCI, Web of Science, UGC-CARE Published Papers, ISSN, DOI & Proofs |
| 🧑‍🏫 **FDP & Workshops** | Faculty Development Programs (AICTE ATAL), STTPs, Hands-on Workshops, Pedagogy |
| 📘 **Book Chapters** | CRC Press, Springer, Taylor & Francis, Apple Academic ISBN Chapters |
| 📕 **Books Authored** | Authored & Edited Books, International Publisher Monographs with ISBN |
| 🔖 **Patents & IPR** | Indian Patent Office (IPO), USPTO, WIPO Patents Filed, Published & Granted |
| 💻 **Courses & Certifications** | NPTEL (IIT Madras), SWAYAM, Coursera, UNESCO, LeadingIndia.ai, Salesforce |
| 🎫 **Memberships** | Life Member ISTE, IAENG, CSTA, ICSES, IAIP & Professional Societies |
| 📌 **Institutional Roles** | IQAC, MIS, Project Coordinator, Moodle Admin, Departmental Responsibilities |
| 📁 **Other Proofs** | Experience Letters, Appraisal Proofs, Relieving Letters, Extracurricular |

---

## ✨ Key Features

1. **Easy Data Upload & Dynamic Form**:
   - Dynamic form adapts fields based on chosen category (e.g. Scopus/DOI for journals, Application No/Status for patents, Duration/Mode for FDPs, CGPA/Degree for College).
   - Drag-and-drop file upload for PDF certificates, PNG, JPG, and DOCX files.
   - Files are safely preserved in `uploads/` with unique filenames.

2. **Instant Retrieval ("Retry Whenever Needed")**:
   - **In-Browser Document Viewer**: Click *View Proof* to preview PDF certificates directly in an embedded viewer or inspect high-resolution images without leaving the dashboard.
   - **1-Click Download**: Download the original certificate anytime.
   - **Live Multi-Facet Filtering**: Filter in real-time by category, year (2006–2025), custom tags (#IEEE, #Scopus, #AICTE, #ATAL), or global keyword search.
   - **Dual Views**: Switch between modern responsive **Grid Card View** and spreadsheet-like **Structured Table View**.

3. **Printable Academic CV & Performance Appraisal (`/cv`)**:
   - Access **`http://127.0.0.1:5050/cv`** for a clean, academic CV layout formatted for NAAC, NBA, and faculty appraisals.
   - Includes 1-click **Print / Save as PDF** with `@media print` styling.

4. **Data Portability & Backup**:
   - **Export to CSV / Excel**: 1-click download of all records with identifiers and tags.
   - **JSON Backup**: Complete snapshot of the SQLite database.
   - **Restore from JSON**: Easy import to restore or merge records anytime.

---

## 📁 Repository Layout

```
D:\AI\ap\RESUME/
├── app.py                  # Flask backend REST API & file serving
├── database.py             # SQLite database layer, schema & queries
├── portfolio.db            # SQLite database with 65 pre-seeded credentials
├── run_dashboard.bat       # 1-click Windows launcher
├── requirements.txt        # Flask & dependencies
├── uploads/                # Safe local storage for uploaded certificate files
│
├── templates/
│   ├── index.html          # Main responsive SPA Dashboard (Tailwind + Lucide)
│   └── cv.html             # Printable Academic CV & Appraisal Summary
│
├── static/
│   ├── css/
│   │   └── custom.css      # Dark mode, animations, badges
│   └── js/
│       └── app.js          # Reactive frontend SPA logic & in-app viewer
│
├── tools/
│   ├── serve-dashboard.bat # Convenience shortcut launcher
│   ├── test_server.py      # Automated 10-suite test script
│   └── import_seed.py      # Seed importer utility
│
├── index.html              # Public website portfolio
└── vault.html              # Private vault (Supabase cloud sync)
```
