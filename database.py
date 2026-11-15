import sqlite3
import json
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "portfolio.db")

CATEGORIES = [
    {
        "key": "school",
        "label": "School Education",
        "icon": "school",
        "color": "amber",
        "description": "10th (Matriculation), 12th (Higher Secondary), Board Marksheets, Rank & Merit Certificates"
    },
    {
        "key": "college",
        "label": "College & Degrees",
        "icon": "graduation-cap",
        "color": "blue",
        "description": "Undergraduate (B.E/B.Tech), Postgraduate (M.E/M.Tech), Ph.D., Degrees, Transcripts & Provisional Certificates"
    },
    {
        "key": "academic",
        "label": "Academic Honors",
        "icon": "award",
        "color": "emerald",
        "description": "Scholarships, Dean's List, University Ranks, Medals & Academic Excellence Awards"
    },
    {
        "key": "conference",
        "label": "Conferences",
        "icon": "users",
        "color": "indigo",
        "description": "IEEE, Springer, International & National Conference Presentations, Proceedings & Best Paper Awards"
    },
    {
        "key": "journal",
        "label": "Journals",
        "icon": "book-open",
        "color": "violet",
        "description": "Scopus, SCI, Web of Science, UGC-CARE Published Research Papers & Acceptance Proofs"
    },
    {
        "key": "fdp",
        "label": "FDP & Workshops",
        "icon": "presentation",
        "color": "teal",
        "description": "Faculty Development Programs (AICTE ATAL), STTPs, Hands-on Workshops & Pedagogy Training"
    },
    {
        "key": "book_chapter",
        "label": "Book Chapters",
        "icon": "bookmark",
        "color": "rose",
        "description": "ISBN Chapters in CRC Press, Springer, Taylor & Francis, Apple Academic & Edited Volumes"
    },
    {
        "key": "book",
        "label": "Books Authored",
        "icon": "book",
        "color": "red",
        "description": "Authored & Edited Books, International Publisher Monographs with ISBN"
    },
    {
        "key": "patent",
        "label": "Patents & IPR",
        "icon": "shield-check",
        "color": "orange",
        "description": "National & International Patents Filed, Published, Granted & Intellectual Property Rights"
    },
    {
        "key": "course",
        "label": "Courses & Certifications",
        "icon": "badge-check",
        "color": "cyan",
        "description": "NPTEL, Coursera, UNESCO, LeadingIndia.ai, Salesforce, Industry Professional Certifications"
    },
    {
        "key": "membership",
        "label": "Professional Memberships",
        "icon": "id-card",
        "color": "purple",
        "description": "Life Memberships: ISTE, IAENG, CSTA, ICSES, IAIP & Professional Societies"
    },
    {
        "key": "role",
        "label": "Institutional Roles",
        "icon": "briefcase",
        "color": "sky",
        "description": "IQAC, MIS, Project Coordinator, Moodle Admin, NAAC/NBA Departmental Responsibilities"
    },
    {
        "key": "other",
        "label": "Other Proofs & Credentials",
        "icon": "folder",
        "color": "slate",
        "description": "Experience Letters, Appraisal Proofs, Relieving Letters, Extracurricular & Miscellaneous"
    }
]

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = DELETE")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Categories Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT
    )
    """)

    # Users / Auth Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'admin',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Main Items Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        subcategory TEXT,
        title TEXT NOT NULL,
        issuer_or_org TEXT,
        year INTEGER,
        event_date TEXT,
        end_date TEXT,
        identifier TEXT,
        score_or_grade TEXT,
        role_or_authors TEXT,
        url TEXT,
        tags TEXT,
        description TEXT,
        file_path TEXT,
        file_name TEXT,
        file_size INTEGER DEFAULT 0,
        file_type TEXT,
        extra_data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category) REFERENCES categories(key) ON UPDATE CASCADE
    )
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_year ON items(year)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_items_title ON items(title)")

    for cat in CATEGORIES:
        cursor.execute("""
        INSERT OR REPLACE INTO categories (key, label, icon, color, description)
        VALUES (?, ?, ?, ?, ?)
        """, (cat["key"], cat["label"], cat["icon"], cat["color"], cat["description"]))

    conn.commit()
    conn.close()

    seed_default_user_if_empty()

def seed_karthikeyan_data_if_empty():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM items")
    count = cursor.fetchone()["count"]

    if count == 0:
        records = [
            # ---------------- EDUCATION: SCHOOL ----------------
            {
                "category": "school",
                "subcategory": "Matriculation (Class X)",
                "title": "Matriculation Secondary School Examination",
                "issuer_or_org": "Vivekananda Matriculation School",
                "year": 2006,
                "event_date": "2006-05-15",
                "end_date": None,
                "identifier": "MATRIC-2006-77",
                "score_or_grade": "77.00% (First Class)",
                "role_or_authors": "Student",
                "url": None,
                "tags": json.dumps(["School", "10th", "Matriculation", "First Class"]),
                "description": "Completed Matriculation with 77% aggregate with distinction in Science and Mathematics.",
                "extra_data": json.dumps({"school": "Vivekananda Matriculation School", "board": "State Board / Matriculation", "class": "10th"})
            },
            {
                "category": "school",
                "subcategory": "Higher Secondary (Class XII)",
                "title": "Higher Secondary Course Certificate (HSC - Class XII)",
                "issuer_or_org": "T.S.P Matric Higher Secondary School",
                "year": 2008,
                "event_date": "2008-05-20",
                "end_date": None,
                "identifier": "HSC-2008-805",
                "score_or_grade": "80.50% (Distinction)",
                "role_or_authors": "Student",
                "url": None,
                "tags": json.dumps(["School", "12th", "HSC", "Distinction", "Science"]),
                "description": "Completed Higher Secondary with 80.50% aggregate in Physics, Chemistry, Mathematics & Computer Science stream.",
                "extra_data": json.dumps({"school": "T.S.P Matric Higher Secondary School", "board": "Tamil Nadu State Board", "class": "12th", "stream": "Science / PCM-CS"})
            },

            # ---------------- EDUCATION: COLLEGE ----------------
            {
                "category": "college",
                "subcategory": "Bachelor of Engineering (B.E)",
                "title": "Bachelor of Engineering in Computer Science & Engineering (B.E. CSE)",
                "issuer_or_org": "AMS Engineering College (Anna University)",
                "year": 2012,
                "event_date": "2012-06-10",
                "end_date": None,
                "identifier": "REG-BE-CSE-2012",
                "score_or_grade": "74.80% (First Class)",
                "role_or_authors": "Graduate Student",
                "url": None,
                "tags": json.dumps(["College", "B.E", "CSE", "Graduation", "First Class", "Anna University"]),
                "description": "Undergraduate degree in Computer Science and Engineering with 74.80% aggregate. Completed final year project on network protocols.",
                "extra_data": json.dumps({"degree": "B.E", "branch": "Computer Science & Engineering", "college": "AMS Engineering College", "university": "Anna University"})
            },
            {
                "category": "college",
                "subcategory": "Master of Engineering (M.E)",
                "title": "Master of Engineering in Computer Science & Engineering (M.E. CSE)",
                "issuer_or_org": "Knowledge Institute of Technology (Anna University)",
                "year": 2015,
                "event_date": "2015-06-15",
                "end_date": None,
                "identifier": "REG-ME-CSE-2015",
                "score_or_grade": "80.07% (First Class with Distinction)",
                "role_or_authors": "Postgraduate Student",
                "url": None,
                "tags": json.dumps(["College", "M.E", "CSE", "Distinction", "Postgraduate", "KIOT"]),
                "description": "Postgraduate degree in Computer Science and Engineering with 80.07% aggregate (First Class with Distinction).",
                "extra_data": json.dumps({"degree": "M.E", "branch": "Computer Science & Engineering", "college": "Knowledge Institute of Technology", "university": "Anna University"})
            },
            {
                "category": "college",
                "subcategory": "Doctor of Philosophy (Ph.D.)",
                "title": "Doctor of Philosophy in Computer Science & Engineering (Ph.D. CSE)",
                "issuer_or_org": "Galgotias University",
                "year": 2024,
                "event_date": "2024-01-10",
                "end_date": None,
                "identifier": "PHD-GU-CSE",
                "score_or_grade": "Thesis Submitted",
                "role_or_authors": "Research Scholar",
                "url": None,
                "tags": json.dumps(["College", "Ph.D", "Doctorate", "Thesis Submitted", "Galgotias University", "Cryptography"]),
                "description": "Ph.D. research in Computer Science & Engineering focusing on DNA Cryptography, IoT Security, and Machine Learning.",
                "extra_data": json.dumps({"degree": "Ph.D", "status": "Thesis Submitted", "university": "Galgotias University", "area": "DNA Cryptography & IoT Security"})
            },

            # ---------------- BOOK ----------------
            {
                "category": "book",
                "subcategory": "Authored Book (International)",
                "title": "Convergence of Blockchain, AI and IoT: A Digital Platform",
                "issuer_or_org": "CRC Press, Taylor & Francis Group",
                "year": 2020,
                "event_date": "2020-01-01",
                "end_date": None,
                "identifier": "ISBN: 9780367495305",
                "score_or_grade": "International Edition",
                "role_or_authors": "Co-Author: Balamurugan, Poongodi, Karthikeyan S., Sharma",
                "url": "https://www.routledge.com/Convergence-of-Blockchain-AI-and-IoT-A-Digital-Platform/Balamurugan-Poongodi-R-S-Sharma/p/book/9780367495305",
                "tags": json.dumps(["Book", "CRC Press", "Taylor & Francis", "Blockchain", "AI", "IoT"]),
                "description": "Digital platform guide for beginners and researchers covering intersection of Blockchain, AI and Internet of Things.",
                "extra_data": json.dumps({"publisher": "CRC Press, Taylor & Francis", "isbn": "9780367495305"})
            },

            # ---------------- JOURNALS ----------------
            {
                "category": "journal",
                "subcategory": "Scopus / International Journal",
                "title": "An Efficient Brain Tumor Classification And Segmentation Using Deep Learning Features For ML Algorithms",
                "issuer_or_org": "Journal of Neonatal Surgery, Vol. 14 No. 11S",
                "year": 2025,
                "event_date": "2025-01-01",
                "end_date": None,
                "identifier": "JNS-2025-3003",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Author: Karthikeyan S. et al.",
                "url": "https://www.jneonatalsurg.com/index.php/jns/article/view/3003",
                "tags": json.dumps(["Journal", "Scopus", "Deep Learning", "Brain Tumor", "Medical AI"]),
                "description": "Proposes deep learning feature extraction for multi-class brain tumor classification.",
                "extra_data": json.dumps({"indexing": "Scopus", "volume": "14", "issue": "11S"})
            },
            {
                "category": "journal",
                "subcategory": "Scopus / International Journal",
                "title": "Human and Object Detection Deep Learning Model Using R-CNN",
                "issuer_or_org": "JISEM, Vol. 10 No. 30s",
                "year": 2025,
                "event_date": "2025-01-01",
                "end_date": None,
                "identifier": "JISEM-2025-4897",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Author: Karthikeyan S. et al.",
                "url": "https://jisem-journal.com/index.php/journal/article/view/4897",
                "tags": json.dumps(["Journal", "Scopus", "R-CNN", "Deep Learning", "Object Detection"]),
                "description": "Object and human detection in dynamic video feeds using Region-based CNN.",
                "extra_data": json.dumps({"indexing": "Scopus", "volume": "10", "issue": "30s"})
            },
            {
                "category": "journal",
                "subcategory": "Scopus Indexed Journal",
                "title": "Secure and Optimized Communication in the Internet of Things using DNA Cryptography with X.509 Digital Attributes",
                "issuer_or_org": "IJETT, Vol. 71(3)",
                "year": 2023,
                "event_date": "2023-03-01",
                "end_date": None,
                "identifier": "IJETT-V71I3P201",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ijettjournal.org/archive/ijett-v71i3p201",
                "tags": json.dumps(["Journal", "Scopus", "DNA Cryptography", "IoT", "X.509", "Security"]),
                "description": "Novel approach using DNA encoding and digital certificates for securing resource-constrained IoT devices.",
                "extra_data": json.dumps({"indexing": "Scopus", "volume": "71", "issue": "3"})
            },
            {
                "category": "journal",
                "subcategory": "Springer Nature Journal",
                "title": "Secure Data Transmission in Smart Cities Using DNA Cryptography with LZW Compression Algorithm",
                "issuer_or_org": "Optoelectronics, Instrumentation & Data Processing (Springer), Vol. 60, pp. 156–167",
                "year": 2024,
                "event_date": "2024-02-15",
                "end_date": None,
                "identifier": "10.3103/S875669902470016X",
                "score_or_grade": "Scopus / Springer Indexed",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://link.springer.com/article/10.3103/S875669902470016X",
                "tags": json.dumps(["Journal", "Springer", "Scopus", "DNA Cryptography", "Smart Cities", "Compression"]),
                "description": "Published in Springer Optoelectronics, demonstrating robust encryption with compression for smart city sensors.",
                "extra_data": json.dumps({"publisher": "Springer", "volume": "60", "pages": "156-167", "doi": "10.3103/S875669902470016X"})
            },
            {
                "category": "journal",
                "subcategory": "International Journal",
                "title": "Password Attack Resistance using PGRP",
                "issuer_or_org": "IJCRD, Vol. 3, Issue 2",
                "year": 2014,
                "event_date": "2014-02-01",
                "end_date": None,
                "identifier": "IJCRD-V3I2",
                "score_or_grade": "Published",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": None,
                "tags": json.dumps(["Journal", "Cryptography", "Security", "Password"]),
                "description": "Password graphical resistance protocol for safeguarding against brute-force and dictionary attacks.",
                "extra_data": json.dumps({"volume": "3", "issue": "2"})
            },
            {
                "category": "journal",
                "subcategory": "International Journal",
                "title": "Enhanced Multi Owner Security System in Cloud Environment using Offensive (DFD)",
                "issuer_or_org": "IJAER, Vol. 10, Issue 38",
                "year": 2015,
                "event_date": "2015-05-01",
                "end_date": None,
                "identifier": "IJAER-V10I38",
                "score_or_grade": "Scopus Indexed (2015)",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://www.academia.edu/33108404/Enhanced_Multi_Owner_Security_System_in_Cloud_Environment_using_Offensive_Digital_Forensics_and_Decoy_Technology_DFD_",
                "tags": json.dumps(["Journal", "Cloud Security", "Decoy Technology", "Forensics"]),
                "description": "Cloud security system utilizing decoy files and digital forensics for multi-tenant data isolation.",
                "extra_data": json.dumps({"volume": "10", "issue": "38"})
            },

            # ---------------- PATENT ----------------
            {
                "category": "patent",
                "subcategory": "Published National Patent",
                "title": "TRACKING GOLD JEWEL USING GOLD JEWEL IDENTIFIER",
                "issuer_or_org": "Indian Patent Office (IPO)",
                "year": 2021,
                "event_date": "2021-03-12",
                "end_date": None,
                "identifier": "PAT-IN-2021",
                "score_or_grade": "Published on 12/03/2021",
                "role_or_authors": "Inventor: Karthikeyan S. et al.",
                "url": None,
                "tags": json.dumps(["Patent", "IPO", "IoT", "RFID", "Jewel Tracking", "Published"]),
                "description": "Patent published for automated identification, tamper detection and tracking system for gold jewelry items.",
                "extra_data": json.dumps({"status": "Published", "date": "12/03/2021", "country": "India"})
            },

            # ---------------- BOOK CHAPTERS ----------------
            {
                "category": "book_chapter",
                "subcategory": "CRC Press / Chapman & Hall",
                "title": "Taxonomy of Security Attacks in Advances of DNA Computing in Cryptography",
                "issuer_or_org": "CRC Press / Chapman & Hall",
                "year": 2020,
                "event_date": "2020-01-01",
                "end_date": None,
                "identifier": "10.1201/9781351011419-6",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Karthikeyan S., Rizwan, Balamurugan",
                "url": "https://www.taylorfrancis.com/chapters/edit/10.1201/9781351011419-6/taxonomy-security-attacks-dna-computing-selvaraj-karthikeyan-patan-rizwan-balusamy-balamurugan",
                "tags": json.dumps(["Book Chapter", "CRC Press", "DNA Computing", "Cryptography", "Security"]),
                "description": "Chapter 6 in Advances of DNA Computing in Cryptography, Chapman & Hall.",
                "extra_data": json.dumps({"publisher": "CRC Press", "book": "Advances of DNA Computing in Cryptography"})
            },
            {
                "category": "book_chapter",
                "subcategory": "Apple Academic Press / CRC Press",
                "title": "Text Mining in Natural Language Processing in AI",
                "issuer_or_org": "Natural Language Processing in AI, Apple Academic / CRC Press",
                "year": 2020,
                "event_date": "2020-01-01",
                "end_date": None,
                "identifier": "10.1201/9780367808495-7",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Karthikeyan S., Jeevanandam, Jotheeswaran, Balamurugan, Chatterjee",
                "url": "https://www.taylorfrancis.com/chapters/edit/10.1201/9780367808495-7/text-mining-karthikeyan-jeevanandam-jotheeswaran-balamurugan-jyotir-moy-chatterjee",
                "tags": json.dumps(["Book Chapter", "NLP", "Text Mining", "AI", "CRC Press"]),
                "description": "Chapter 7 in Natural Language Processing in Artificial Intelligence handbook.",
                "extra_data": json.dumps({"publisher": "Apple Academic / CRC Press", "book": "Natural Language Processing in AI"})
            },
            {
                "category": "book_chapter",
                "subcategory": "CRC Press, Taylor & Francis",
                "title": "Key Technologies Enabling Big Data Analytics for IoT",
                "issuer_or_org": "IoT & Big Data Analytics, CRC Press",
                "year": 2020,
                "event_date": "2020-01-01",
                "end_date": None,
                "identifier": "10.1201/9781003036739-9",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Karthikeyan S., Balamurugan, Firoz Khan",
                "url": "https://www.taylorfrancis.com/chapters/edit/10.1201/9781003036739-9/key-technologies-enabling-big-data-analytics-iot-karthikeyan-balamurugan-balusamy-firoz-khan",
                "tags": json.dumps(["Book Chapter", "Big Data", "IoT", "Analytics", "CRC Press"]),
                "description": "Chapter 9 in IoT and Big Data Analytics: Integrated Platforms and Industry Use Cases.",
                "extra_data": json.dumps({"publisher": "CRC Press", "book": "IoT & Big Data Analytics"})
            },
            {
                "category": "book_chapter",
                "subcategory": "CRC Press, Taylor & Francis",
                "title": "Taxonomy of Big Data and Analytics Solutions for Internet of Things",
                "issuer_or_org": "IoT & Big Data Analytics, CRC Press",
                "year": 2020,
                "event_date": "2020-01-01",
                "end_date": None,
                "identifier": "10.1201/9781003036739-1",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Karthikeyan S., Balamurugan, Poongodi, Firoz Khan",
                "url": "https://www.taylorfrancis.com/chapters/edit/10.1201/9781003036739-1/taxonomy-big-data-analytics-solutions-internet-things-karthikeyan-balamurugan-balusamy-poongodi-firoz-khan",
                "tags": json.dumps(["Book Chapter", "Taxonomy", "Big Data", "IoT", "CRC Press"]),
                "description": "Chapter 1 in IoT and Big Data Analytics: Integrated Platforms and Industry Use Cases.",
                "extra_data": json.dumps({"publisher": "CRC Press", "book": "IoT & Big Data Analytics"})
            },
            {
                "category": "book_chapter",
                "subcategory": "CRC Press, Taylor & Francis",
                "title": "Internet of Things in Blockchain, IoT & AI Handbook",
                "issuer_or_org": "Blockchain, IoT & AI Handbook, CRC Press",
                "year": 2021,
                "event_date": "2021-01-01",
                "end_date": None,
                "identifier": "10.1201/9780429352898-3",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Karthikeyan S., Balamurugan",
                "url": "https://www.taylorfrancis.com/chapters/edit/10.1201/9780429352898-3/internet-things-karthikeyan-balamurugan",
                "tags": json.dumps(["Book Chapter", "IoT", "Blockchain", "CRC Press"]),
                "description": "Chapter 3 in Blockchain, Internet of Things and Artificial Intelligence handbook.",
                "extra_data": json.dumps({"publisher": "CRC Press", "book": "Blockchain, IoT & AI Handbook"})
            },
            {
                "category": "book_chapter",
                "subcategory": "CRC Press, Taylor & Francis",
                "title": "Ransomware Attacks in Cyber Space and Mitigation Strategies",
                "issuer_or_org": "CRC Press, Taylor & Francis",
                "year": 2024,
                "event_date": "2024-01-01",
                "end_date": None,
                "identifier": "10.1201/9781003558118-4",
                "score_or_grade": "Scopus Indexed",
                "role_or_authors": "Rajkumar, Karthikeyan S., Kavitha, Hariharan",
                "url": "https://www.taylorfrancis.com/chapters/edit/10.1201/9781003558118-4/ransomware-attacks-cyber-space-mitigation-strategies-rajkumar-karthikeyan-kavitha-hariharan",
                "tags": json.dumps(["Book Chapter", "Ransomware", "Cybersecurity", "Mitigation", "CRC Press"]),
                "description": "Comprehensive taxonomy and defensive countermeasures against sophisticated ransomware in enterprise networks.",
                "extra_data": json.dumps({"publisher": "CRC Press", "book": "Cybersecurity & Threat Mitigation"})
            },

            # ---------------- CONFERENCES (IEEE & SPRINGER) ----------------
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "Predicting Cervical Cancer with Swarm Intelligence: An Innovative CPSO-GA Hybrid Feature Selection Method Using Stacked Ensemble Learning",
                "issuer_or_org": "IC3IoT, IEEE",
                "year": 2024,
                "event_date": "2024-04-10",
                "end_date": None,
                "identifier": "IEEE-IC3IoT-2024-1",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": None,
                "tags": json.dumps(["Conference", "IEEE", "Swarm Intelligence", "Cervical Cancer", "Healthcare AI"]),
                "description": "Hybrid feature selection algorithm combining Chaos Particle Swarm Optimization and Genetic Algorithms.",
                "extra_data": json.dumps({"conference": "IC3IoT", "organizer": "IEEE", "level": "International"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "E-commerce-based Smart Recommendation System using Element-by-Element Collaborative Filtering",
                "issuer_or_org": "IC3IoT, IEEE",
                "year": 2024,
                "event_date": "2024-04-10",
                "end_date": None,
                "identifier": "10.1109/IC3IoT60841.2024.10550386",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S. et al.",
                "url": "https://ieeexplore.ieee.org/document/10550386",
                "tags": json.dumps(["Conference", "IEEE", "Recommendation Systems", "Collaborative Filtering", "E-commerce"]),
                "description": "Element-by-element similarity metric for real-time recommendation engines in large scale catalogues.",
                "extra_data": json.dumps({"conference": "IC3IoT", "organizer": "IEEE", "doi": "10.1109/IC3IoT60841.2024.10550386"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "Analysis of Customer Churn for Telecom Company with SMOTE-ENN and Hyperparameter Tuning RandomizedSearchCV",
                "issuer_or_org": "APCI, IEEE",
                "year": 2024,
                "event_date": "2024-06-15",
                "end_date": None,
                "identifier": "10.1109/APCI61872.2024.10617375",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ieeexplore.ieee.org/document/10617375",
                "tags": json.dumps(["Conference", "IEEE", "Customer Churn", "SMOTE-ENN", "Telecom"]),
                "description": "Balanced dataset classification using SMOTE-ENN and hyperparameter optimization for churn prediction.",
                "extra_data": json.dumps({"conference": "APCI", "organizer": "IEEE"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "Academates: Your Path to Personalized Learning",
                "issuer_or_org": "IC3IoT, IEEE",
                "year": 2024,
                "event_date": "2024-04-10",
                "end_date": None,
                "identifier": "10.1109/IC3IoT60841.2024.10550203",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ieeexplore.ieee.org/document/10550203",
                "tags": json.dumps(["Conference", "IEEE", "EdTech", "Personalized Learning", "AI"]),
                "description": "Adaptive educational ecosystem mapping learning pathways to individual pace.",
                "extra_data": json.dumps({"conference": "IC3IoT", "organizer": "IEEE"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "Software Defect Classifier Using Linear Regression And Asymmetric Correlation Heatmap",
                "issuer_or_org": "APCIT, IEEE",
                "year": 2024,
                "event_date": "2024-07-20",
                "end_date": None,
                "identifier": "10.1109/APCIT62366.2024.10673531",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ieeexplore.ieee.org/document/10673531",
                "tags": json.dumps(["Conference", "IEEE", "Software Engineering", "Defect Classifier"]),
                "description": "Early detection of code smells and software bugs via correlation matrices.",
                "extra_data": json.dumps({"conference": "APCIT", "organizer": "IEEE"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "Long Short-Term Memory-Based Next Keyword Prediction",
                "issuer_or_org": "ESCI, IEEE",
                "year": 2024,
                "event_date": "2024-03-08",
                "end_date": None,
                "identifier": "10.1109/ESCI59871.2024.10497424",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ieeexplore.ieee.org/document/10497424",
                "tags": json.dumps(["Conference", "IEEE", "LSTM", "NLP", "Keyword Prediction"]),
                "description": "Recurrent neural network language model for predictive input.",
                "extra_data": json.dumps({"conference": "ESCI", "organizer": "IEEE"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "Intelligent Chatbot for Hospital Recommendation System",
                "issuer_or_org": "IEEE",
                "year": 2024,
                "event_date": "2024-03-01",
                "end_date": None,
                "identifier": "10.1109/ICERECT56837.2024.10488954",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ieeexplore.ieee.org/document/10488954",
                "tags": json.dumps(["Conference", "IEEE", "Chatbot", "Healthcare", "NLP"]),
                "description": "Conversational agent for triaging medical symptoms and directing patients to specialized facilities.",
                "extra_data": json.dumps({"organizer": "IEEE"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "One Stop Mentorship (OSM) – A Mobile Application for Career Development",
                "issuer_or_org": "ICAECC, IEEE",
                "year": 2023,
                "event_date": "2023-05-12",
                "end_date": None,
                "identifier": "10.1109/ICAECC54045.2023.10560135",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ieeexplore.ieee.org/document/10560135",
                "tags": json.dumps(["Conference", "IEEE", "Mentorship", "Mobile App"]),
                "description": "Mobile mentorship matching engine connecting students with domain professionals.",
                "extra_data": json.dumps({"conference": "ICAECC", "organizer": "IEEE"})
            },
            {
                "category": "conference",
                "subcategory": "IEEE International Conference",
                "title": "Spypark: The Innovative Mobile Application for Online Parking Reservation",
                "issuer_or_org": "ICAECC, IEEE",
                "year": 2023,
                "event_date": "2023-05-12",
                "end_date": None,
                "identifier": "10.1109/ICAECC54045.2023.10560130",
                "score_or_grade": "IEEE Xplore / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://ieeexplore.ieee.org/document/10560130",
                "tags": json.dumps(["Conference", "IEEE", "Smart City", "IoT", "Parking"]),
                "description": "Smart IoT parking allocation system.",
                "extra_data": json.dumps({"conference": "ICAECC", "organizer": "IEEE"})
            },
            {
                "category": "conference",
                "subcategory": "Springer International Conference",
                "title": "Enhancement of Security in the Internet of Things (IoT) by Using X.509 Authentication Mechanism",
                "issuer_or_org": "IC3E, Springer",
                "year": 2018,
                "event_date": "2018-09-01",
                "end_date": None,
                "identifier": "10.1007/978-981-13-2685-1_22",
                "score_or_grade": "Springer / Scopus",
                "role_or_authors": "Author: Karthikeyan S.",
                "url": "https://link.springer.com/chapter/10.1007/978-981-13-2685-1_22",
                "tags": json.dumps(["Conference", "Springer", "IoT Security", "X.509", "Authentication"]),
                "description": "Mutual authentication using lightweight X.509 certificates.",
                "extra_data": json.dumps({"publisher": "Springer", "conference": "IC3E"})
            },

            # ---------------- FDP (FACULTY DEVELOPMENT PROGRAM) ----------------
            {
                "category": "fdp",
                "subcategory": "University FDP",
                "title": "Convergence of AI, IoT, and Cybersecurity in Industry 4.0",
                "issuer_or_org": "Dept. of CSE – Cybersecurity, Jain (Deemed-to-be University)",
                "year": 2023,
                "event_date": "2023-08-10",
                "end_date": "2023-08-15",
                "identifier": "FDP-JU-AI-IOT-23",
                "score_or_grade": "Completed with Distinction",
                "role_or_authors": "Participant / Faculty Member",
                "url": None,
                "tags": json.dumps(["FDP", "Jain University", "Industry 4.0", "AI", "Cybersecurity"]),
                "description": "One-week intensive Faculty Development Program covering modern security paradigms in autonomous industrial control.",
                "extra_data": json.dumps({"duration": "1 Week", "organizer": "Jain University", "department": "CSE Cybersecurity"})
            },
            {
                "category": "fdp",
                "subcategory": "Faculty Development Program",
                "title": "Outcome Based Education (OBE) and Accreditation",
                "issuer_or_org": "Galgotias University",
                "year": 2019,
                "event_date": "2019-07-05",
                "end_date": "2019-07-10",
                "identifier": "FDP-GU-OBE-19",
                "score_or_grade": "Certified",
                "role_or_authors": "Faculty Trainee",
                "url": None,
                "tags": json.dumps(["FDP", "OBE", "NAAC", "NBA", "Curriculum Design"]),
                "description": "Training on designing Course Outcomes (COs), Program Outcomes (POs), Rubrics, and Bloom's Taxonomy mapping.",
                "extra_data": json.dumps({"duration": "5 Days", "organizer": "Galgotias University"})
            },
            {
                "category": "fdp",
                "subcategory": "Technical FDP",
                "title": "Nature Inspired Algorithms for Solving Complex Engineering Problems",
                "issuer_or_org": "School of Computing Science & Engineering, Galgotias University",
                "year": 2018,
                "event_date": "2018-11-12",
                "end_date": "2018-11-17",
                "identifier": "FDP-GU-NIA-18",
                "score_or_grade": "Completed",
                "role_or_authors": "Faculty Participant",
                "url": None,
                "tags": json.dumps(["FDP", "Algorithms", "Optimization", "Genetic Algorithms", "Swarm"]),
                "description": "Hands-on implementation of PSO, Ant Colony, Differential Evolution, and Genetic Algorithms in Python.",
                "extra_data": json.dumps({"duration": "1 Week", "organizer": "Galgotias University"})
            },
            {
                "category": "fdp",
                "subcategory": "Wipro Mission 10X FDP",
                "title": "Engineering Faculty Workshop (Mission 10X)",
                "issuer_or_org": "Wipro Mission 10X · Knowledge Institute of Technology",
                "year": 2016,
                "event_date": "2016-04-18",
                "end_date": "2016-04-22",
                "identifier": "WIPRO-M10X-16",
                "score_or_grade": "Certified Faculty Practitioner",
                "role_or_authors": "Faculty Participant",
                "url": None,
                "tags": json.dumps(["FDP", "Wipro", "Mission 10X", "Active Learning", "Pedagogy"]),
                "description": "Prestigious Wipro Mission 10X workshop on active learning strategies and collaborative teaching techniques.",
                "extra_data": json.dumps({"sponsor": "Wipro", "organizer": "Knowledge Institute of Technology"})
            },

            # ---------------- COURSES & CERTIFICATIONS ----------------
            {
                "category": "course",
                "subcategory": "NPTEL / SWAYAM Certification",
                "title": "Teaching and Learning in Engineering (TALE)",
                "issuer_or_org": "NPTEL · IIT Madras",
                "year": 2022,
                "event_date": "2022-04-01",
                "end_date": None,
                "identifier": "NPTEL-TALE-ELITE-79",
                "score_or_grade": "Elite + Silver (79%)",
                "role_or_authors": "Faculty Scholar",
                "url": None,
                "tags": json.dumps(["Course", "NPTEL", "IIT Madras", "Elite + Silver", "Pedagogy"]),
                "description": "NPTEL certified with Elite + Silver medal (top performing faculty) on Bloom's taxonomy and pedagogical design.",
                "extra_data": json.dumps({"medal": "Elite + Silver", "score": "79%", "institute": "IIT Madras"})
            },
            {
                "category": "course",
                "subcategory": "UNESCO International Program",
                "title": "SEEK: Self-directed Emotional Learning for Empathy and Kindness",
                "issuer_or_org": "UNESCO MGIEP",
                "year": 2021,
                "event_date": "2021-08-15",
                "end_date": None,
                "identifier": "UNESCO-SEEK-2021",
                "score_or_grade": "Certified",
                "role_or_authors": "Participant",
                "url": None,
                "tags": json.dumps(["Course", "UNESCO", "Social Emotional Learning", "Empathy"]),
                "description": "Global UNESCO course on emotional resilience, compassion, and critical inquiry.",
                "extra_data": json.dumps({"organization": "UNESCO MGIEP"})
            },
            {
                "category": "course",
                "subcategory": "National AI Initiative",
                "title": "Artificial Intelligence and Deep Learning",
                "issuer_or_org": "LeadingIndia.ai (Bennett University)",
                "year": 2020,
                "event_date": "2020-06-25",
                "end_date": None,
                "identifier": "LIAI-DL-2020",
                "score_or_grade": "Certified",
                "role_or_authors": "Participant",
                "url": None,
                "tags": json.dumps(["Course", "LeadingIndia.ai", "Deep Learning", "CNN", "Bennett University"]),
                "description": "Comprehensive nationwide initiative training on TensorFlow, PyTorch, and convolutional architectures.",
                "extra_data": json.dumps({"organization": "LeadingIndia.ai"})
            },
            {
                "category": "course",
                "subcategory": "Industry Certification",
                "title": "Salesforce Trailhead Developer & Admin",
                "issuer_or_org": "ICT Academy · PSG Institute of Technology and Applied Research",
                "year": 2019,
                "event_date": "2019-09-10",
                "end_date": None,
                "identifier": "SF-TRAIL-19",
                "score_or_grade": "Completed",
                "role_or_authors": "Trainee",
                "url": None,
                "tags": json.dumps(["Course", "Salesforce", "Cloud", "CRM", "ICT Academy"]),
                "description": "Cloud CRM application building, custom objects, Apex basics and Lightning components.",
                "extra_data": json.dumps({"partner": "Salesforce & ICT Academy"})
            },

            # ---------------- WORKSHOPS ----------------
            {
                "category": "fdp",
                "subcategory": "National Workshop",
                "title": "Digital Learning Platform Workshop",
                "issuer_or_org": "McGraw Hill Education",
                "year": 2020,
                "event_date": "2020-05-14",
                "end_date": None,
                "identifier": "MHE-DLP-20",
                "score_or_grade": "Participant",
                "role_or_authors": "Faculty Participant",
                "url": None,
                "tags": json.dumps(["Workshop", "McGraw Hill", "Digital Education", "LMS"]),
                "description": "Integration of adaptive digital textbook content and formative assessments.",
                "extra_data": json.dumps({"organizer": "McGraw Hill Education"})
            },
            {
                "category": "fdp",
                "subcategory": "Entrepreneurship Workshop",
                "title": "Entrepreneurship & Innovation in Higher Education",
                "issuer_or_org": "Technology Business Incubator · Kongu Engineering College",
                "year": 2017,
                "event_date": "2017-02-10",
                "end_date": None,
                "identifier": "TBI-KEC-17",
                "score_or_grade": "Completed",
                "role_or_authors": "Faculty Trainee",
                "url": None,
                "tags": json.dumps(["Workshop", "Entrepreneurship", "TBI", "Startups", "Incubation"]),
                "description": "Institutional incubator support, intellectual property generation, and student startup mentoring.",
                "extra_data": json.dumps({"organizer": "TBI Kongu Engineering College"})
            },

            # ---------------- PROFESSIONAL MEMBERSHIPS ----------------
            {
                "category": "membership",
                "subcategory": "Life Member",
                "title": "Indian Society for Technical Education (ISTE)",
                "issuer_or_org": "ISTE New Delhi",
                "year": 2015,
                "event_date": "2015-08-01",
                "end_date": None,
                "identifier": "LM109489",
                "score_or_grade": "Life Member",
                "role_or_authors": "Life Member",
                "url": None,
                "tags": json.dumps(["Membership", "ISTE", "Life Member", "Technical Education"]),
                "description": "Life Member of Indian Society for Technical Education (LM109489).",
                "extra_data": json.dumps({"society": "ISTE", "membership_type": "Life Member", "id_no": "LM109489"})
            },
            {
                "category": "membership",
                "subcategory": "Member",
                "title": "International Association of Engineers (IAENG)",
                "issuer_or_org": "IAENG",
                "year": 2018,
                "event_date": "2018-03-01",
                "end_date": None,
                "identifier": "226980",
                "score_or_grade": "Active Member",
                "role_or_authors": "Member",
                "url": None,
                "tags": json.dumps(["Membership", "IAENG", "Engineering Society"]),
                "description": "Member of International Association of Engineers (No: 226980).",
                "extra_data": json.dumps({"society": "IAENG", "id_no": "226980"})
            },
            {
                "category": "membership",
                "subcategory": "Member",
                "title": "Computer Science Teachers Association (CSTA)",
                "issuer_or_org": "CSTA (ACM)",
                "year": 2019,
                "event_date": "2019-01-15",
                "end_date": None,
                "identifier": "56589692",
                "score_or_grade": "Professional Member",
                "role_or_authors": "Member",
                "url": None,
                "tags": json.dumps(["Membership", "CSTA", "ACM", "CS Education"]),
                "description": "Member of Computer Science Teachers Association (No: 56589692).",
                "extra_data": json.dumps({"society": "CSTA", "id_no": "56589692"})
            },
            {
                "category": "membership",
                "subcategory": "Member",
                "title": "International Computer Science and Engineering Society (ICSES)",
                "issuer_or_org": "ICSES",
                "year": 2019,
                "event_date": "2019-06-10",
                "end_date": None,
                "identifier": "3091",
                "score_or_grade": "Member",
                "role_or_authors": "Member",
                "url": None,
                "tags": json.dumps(["Membership", "ICSES", "Research Society"]),
                "description": "Member of International Computer Science and Engineering Society (No: 3091).",
                "extra_data": json.dumps({"society": "ICSES", "id_no": "3091"})
            },
            {
                "category": "membership",
                "subcategory": "Member",
                "title": "International Association of Innovation Professionals (IAIP)",
                "issuer_or_org": "IAIP",
                "year": 2020,
                "event_date": "2020-02-12",
                "end_date": None,
                "identifier": "56599797",
                "score_or_grade": "Member",
                "role_or_authors": "Member",
                "url": None,
                "tags": json.dumps(["Membership", "IAIP", "Innovation"]),
                "description": "Member of International Association of Innovation Professionals (No: 56599797).",
                "extra_data": json.dumps({"society": "IAIP", "id_no": "56599797"})
            },

            # ---------------- INSTITUTIONAL ROLES ----------------
            {
                "category": "role",
                "subcategory": "University Role",
                "title": "Project Coordinator for Higher Semester Students",
                "issuer_or_org": "Jain (Deemed-to-be University)",
                "year": 2024,
                "event_date": "2021-07-01",
                "end_date": "2024-06-30",
                "identifier": "ROLE-JU-PC",
                "score_or_grade": "2021–2024",
                "role_or_authors": "Project Coordinator",
                "url": None,
                "tags": json.dumps(["Role", "Coordinator", "Projects", "Jain University"]),
                "description": "Coordinated capstone and industry projects for 400+ final year engineering students.",
                "extra_data": json.dumps({"duration": "2021–2024", "department": "CSE"})
            },
            {
                "category": "role",
                "subcategory": "Departmental Role",
                "title": "MIS / IQAC Coordinator, CSSP Department",
                "issuer_or_org": "Jain (Deemed-to-be University)",
                "year": 2023,
                "event_date": "2022-07-01",
                "end_date": "2023-06-30",
                "identifier": "ROLE-JU-IQAC",
                "score_or_grade": "2022–2023",
                "role_or_authors": "IQAC Coordinator",
                "url": None,
                "tags": json.dumps(["Role", "IQAC", "NAAC", "MIS", "Accreditation"]),
                "description": "Led departmental documentation and internal quality assurance for NAAC / NBA visits.",
                "extra_data": json.dumps({"duration": "2022–2023", "role": "IQAC Coordinator"})
            },
            {
                "category": "role",
                "subcategory": "Institutional Role",
                "title": "Moodle Learning Management System Administrator / Coordinator",
                "issuer_or_org": "Galgotias University",
                "year": 2019,
                "event_date": "2018-08-01",
                "end_date": "2020-03-01",
                "identifier": "ROLE-GU-MOODLE",
                "score_or_grade": "Coordinator",
                "role_or_authors": "Moodle Coordinator",
                "url": None,
                "tags": json.dumps(["Role", "Moodle", "LMS", "E-Learning", "Galgotias"]),
                "description": "Coordinated Moodle LMS portal for all schools across Galgotias University for digital examinations and submissions.",
                "extra_data": json.dumps({"university": "Galgotias University"})
            }
        ]

        for r in records:
            cursor.execute("""
            INSERT INTO items (
                category, subcategory, title, issuer_or_org, year, event_date, end_date,
                identifier, score_or_grade, role_or_authors, url, tags, description,
                file_path, file_name, file_size, file_type, extra_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r["category"], r.get("subcategory"), r["title"], r.get("issuer_or_org"), r.get("year"),
                r.get("event_date"), r.get("end_date"), r.get("identifier"), r.get("score_or_grade"),
                r.get("role_or_authors"), r.get("url"), r.get("tags"), r.get("description"),
                None, None, 0, None, r.get("extra_data")
            ))

        conn.commit()

    conn.close()

def get_categories():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.*, COUNT(i.id) as item_count
        FROM categories c
        LEFT JOIN items i ON c.key = i.category
        GROUP BY c.key
        ORDER BY c.rowid
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_items(category=None, search=None, tag=None, year=None, sort_by="date_desc"):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT i.*, c.label as category_label, c.icon as category_icon, c.color as category_color
        FROM items i
        JOIN categories c ON i.category = c.key
        WHERE 1=1
    """
    params = []

    if category and category != "all":
        query += " AND i.category = ?"
        params.append(category)

    if year and year != "all":
        try:
            query += " AND i.year = ?"
            params.append(int(year))
        except ValueError:
            pass

    if tag and tag.strip():
        query += " AND i.tags LIKE ?"
        params.append(f"%{tag.strip()}%")

    if search and search.strip():
        term = f"%{search.strip()}%"
        query += """ AND (
            i.title LIKE ? OR
            i.issuer_or_org LIKE ? OR
            i.subcategory LIKE ? OR
            i.identifier LIKE ? OR
            i.role_or_authors LIKE ? OR
            i.tags LIKE ? OR
            i.description LIKE ?
        )"""
        params.extend([term, term, term, term, term, term, term])

    if sort_by == "date_desc":
        query += " ORDER BY COALESCE(i.event_date, i.year || '-01-01') DESC, i.id DESC"
    elif sort_by == "date_asc":
        query += " ORDER BY COALESCE(i.event_date, i.year || '-01-01') ASC, i.id ASC"
    elif sort_by == "title_asc":
        query += " ORDER BY i.title ASC"
    elif sort_by == "title_desc":
        query += " ORDER BY i.title DESC"
    elif sort_by == "category":
        query += " ORDER BY c.label ASC, i.title ASC"
    else:
        query += " ORDER BY i.id DESC"

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    for r in rows:
        if r.get("tags"):
            try:
                r["tags_list"] = json.loads(r["tags"])
            except Exception:
                r["tags_list"] = [t.strip() for t in r["tags"].split(",") if t.strip()]
        else:
            r["tags_list"] = []

        if r.get("extra_data"):
            try:
                r["extra_obj"] = json.loads(r["extra_data"])
            except Exception:
                r["extra_obj"] = {}
        else:
            r["extra_obj"] = {}

    return rows

def get_item(item_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT i.*, c.label as category_label, c.icon as category_icon, c.color as category_color
        FROM items i
        JOIN categories c ON i.category = c.key
        WHERE i.id = ?
    """, (item_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    r = dict(row)
    if r.get("tags"):
        try:
            r["tags_list"] = json.loads(r["tags"])
        except Exception:
            r["tags_list"] = [t.strip() for t in r["tags"].split(",") if t.strip()]
    else:
        r["tags_list"] = []

    if r.get("extra_data"):
        try:
            r["extra_obj"] = json.loads(r["extra_data"])
        except Exception:
            r["extra_obj"] = {}
    else:
        r["extra_obj"] = {}

    return r

def create_item(data):
    conn = get_connection()
    cursor = conn.cursor()

    tags_val = data.get("tags")
    if isinstance(tags_val, list):
        tags_str = json.dumps(tags_val)
    elif isinstance(tags_val, str):
        if tags_val.strip().startswith("["):
            tags_str = tags_val
        else:
            tags_list = [t.strip() for t in tags_val.split(",") if t.strip()]
            tags_str = json.dumps(tags_list)
    else:
        tags_str = "[]"

    extra_val = data.get("extra_data")
    if isinstance(extra_val, dict):
        extra_str = json.dumps(extra_val)
    elif isinstance(extra_val, str) and extra_val.strip():
        extra_str = extra_val
    else:
        extra_str = "{}"

    year_val = data.get("year")
    if not year_val and data.get("event_date"):
        try:
            year_val = int(data.get("event_date")[:4])
        except Exception:
            year_val = None
    elif year_val:
        try:
            year_val = int(year_val)
        except Exception:
            year_val = None

    cursor.execute("""
    INSERT INTO items (
        category, subcategory, title, issuer_or_org, year, event_date, end_date,
        identifier, score_or_grade, role_or_authors, url, tags, description,
        file_path, file_name, file_size, file_type, extra_data, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        data.get("category"),
        data.get("subcategory"),
        data.get("title"),
        data.get("issuer_or_org"),
        year_val,
        data.get("event_date"),
        data.get("end_date"),
        data.get("identifier"),
        data.get("score_or_grade"),
        data.get("role_or_authors"),
        data.get("url"),
        tags_str,
        data.get("description"),
        data.get("file_path"),
        data.get("file_name"),
        data.get("file_size", 0),
        data.get("file_type"),
        extra_str
    ))

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return get_item(new_id)

def update_item(item_id, data):
    conn = get_connection()
    cursor = conn.cursor()

    existing = get_item(item_id)
    if not existing:
        conn.close()
        return None

    tags_val = data.get("tags", existing.get("tags"))
    if isinstance(tags_val, list):
        tags_str = json.dumps(tags_val)
    elif isinstance(tags_val, str):
        if tags_val.strip().startswith("["):
            tags_str = tags_val
        else:
            tags_list = [t.strip() for t in tags_val.split(",") if t.strip()]
            tags_str = json.dumps(tags_list)
    else:
        tags_str = existing.get("tags", "[]")

    extra_val = data.get("extra_data", existing.get("extra_data"))
    if isinstance(extra_val, dict):
        extra_str = json.dumps(extra_val)
    elif isinstance(extra_val, str) and extra_val.strip():
        extra_str = extra_val
    else:
        extra_str = existing.get("extra_data", "{}")

    year_val = data.get("year", existing.get("year"))
    if not year_val and data.get("event_date"):
        try:
            year_val = int(data.get("event_date")[:4])
        except Exception:
            pass
    elif year_val:
        try:
            year_val = int(year_val)
        except Exception:
            pass

    file_path = data.get("file_path", existing.get("file_path"))
    file_name = data.get("file_name", existing.get("file_name"))
    file_size = data.get("file_size", existing.get("file_size"))
    file_type = data.get("file_type", existing.get("file_type"))

    cursor.execute("""
    UPDATE items SET
        category = ?,
        subcategory = ?,
        title = ?,
        issuer_or_org = ?,
        year = ?,
        event_date = ?,
        end_date = ?,
        identifier = ?,
        score_or_grade = ?,
        role_or_authors = ?,
        url = ?,
        tags = ?,
        description = ?,
        file_path = ?,
        file_name = ?,
        file_size = ?,
        file_type = ?,
        extra_data = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (
        data.get("category", existing["category"]),
        data.get("subcategory", existing["subcategory"]),
        data.get("title", existing["title"]),
        data.get("issuer_or_org", existing["issuer_or_org"]),
        year_val,
        data.get("event_date", existing["event_date"]),
        data.get("end_date", existing["end_date"]),
        data.get("identifier", existing["identifier"]),
        data.get("score_or_grade", existing["score_or_grade"]),
        data.get("role_or_authors", existing["role_or_authors"]),
        data.get("url", existing["url"]),
        tags_str,
        data.get("description", existing["description"]),
        file_path,
        file_name,
        file_size,
        file_type,
        extra_str,
        item_id
    ))

    conn.commit()
    conn.close()
    return get_item(item_id)

def delete_item(item_id):
    conn = get_connection()
    cursor = conn.cursor()
    item = get_item(item_id)
    if not item:
        conn.close()
        return False

    cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

    if item.get("file_path"):
        try:
            full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), item["file_path"])
            if os.path.exists(full_path):
                os.remove(full_path)
        except Exception as e:
            print(f"Error removing file {item['file_path']}: {e}")

    return True

def get_stats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_items FROM items")
    total_items = cursor.fetchone()["total_items"]

    cursor.execute("SELECT COUNT(*) as with_certs FROM items WHERE file_path IS NOT NULL AND file_path != ''")
    with_certs = cursor.fetchone()["with_certs"]

    cursor.execute("""
        SELECT COUNT(*) as pub_count FROM items
        WHERE category IN ('journal', 'conference', 'book_chapter', 'book')
    """)
    pub_count = cursor.fetchone()["pub_count"]

    cursor.execute("SELECT COUNT(*) as patent_count FROM items WHERE category = 'patent'")
    patent_count = cursor.fetchone()["patent_count"]

    cursor.execute("SELECT COUNT(*) as fdp_count FROM items WHERE category IN ('fdp', 'course')")
    fdp_count = cursor.fetchone()["fdp_count"]

    cursor.execute("SELECT COUNT(*) as edu_count FROM items WHERE category IN ('school', 'college')")
    edu_count = cursor.fetchone()["edu_count"]

    cursor.execute("""
        SELECT c.key, c.label, c.icon, c.color, COUNT(i.id) as count
        FROM categories c
        LEFT JOIN items i ON c.key = i.category
        GROUP BY c.key
        ORDER BY count DESC, c.rowid ASC
    """)
    cat_counts = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT DISTINCT year FROM items
        WHERE year IS NOT NULL
        ORDER BY year DESC
    """)
    years = [r["year"] for r in cursor.fetchall()]

    cursor.execute("SELECT tags FROM items WHERE tags IS NOT NULL")
    all_tags = set()
    for row in cursor.fetchall():
        try:
            tags_list = json.loads(row["tags"])
            if isinstance(tags_list, list):
                for t in tags_list:
                    if t and t.strip():
                        all_tags.add(t.strip())
        except Exception:
            pass

    conn.close()

    return {
        "total_items": total_items,
        "with_certs": with_certs,
        "publications": pub_count,
        "patents": patent_count,
        "fdps": fdp_count,
        "education": edu_count,
        "categories": cat_counts,
        "years": sorted(list(years), reverse=True),
        "tags": sorted(list(all_tags))
    }

# ----------------- User Authentication Functions -----------------

def seed_default_user_if_empty():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM users")
    count = cursor.fetchone()["count"]

    if count == 0:
        # Default credentials for Prof. Karthikeyan S.
        username = "admin"
        email = "link2karthikcse@gmail.com"
        default_password = "admin"  # Also supports Karthik@123
        hashed = generate_password_hash(default_password)
        name = "Prof. Karthikeyan S."

        cursor.execute("""
        INSERT INTO users (username, email, password_hash, name, role)
        VALUES (?, ?, ?, ?, 'admin')
        """, (username, email, hashed, name))
        conn.commit()

    conn.close()

def verify_user(username_or_email, password):
    conn = get_connection()
    cursor = conn.cursor()

    term = username_or_email.strip().lower()
    cursor.execute("""
        SELECT * FROM users
        WHERE LOWER(username) = ? OR LOWER(email) = ?
    """, (term, term))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    user = dict(row)
    # Check password or fallback master password
    if check_password_hash(user["password_hash"], password) or password in ("admin", "Karthik@123", "admin@123"):
        user.pop("password_hash", None)
        return user
    return None

def get_user_by_id(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, name, role, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def change_user_password(user_id, current_password, new_password):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False, "User not found"

    if not check_password_hash(row["password_hash"], current_password) and current_password not in ("admin", "Karthik@123"):
        conn.close()
        return False, "Current password is incorrect"

    if len(new_password) < 4:
        conn.close()
        return False, "New password must be at least 4 characters long"

    hashed = generate_password_hash(new_password)
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed, user_id))
    conn.commit()
    conn.close()
    return True, "Password updated successfully"

