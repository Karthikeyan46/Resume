-- ============================================================================
--  SEED: imports everything that used to be hard-coded in index.html into the
--  records table, marked public. Run AFTER db/schema.sql and AFTER you have
--  created your login account (Authentication -> Users -> Add user).
--
--  Covers: publications, certifications (split into FDP / workshop / course),
--  professional memberships and institutional roles.
--
--  Safe to re-run: it deletes previously seeded rows first (seeded rows are
--  tagged 'seed'). Rows you add later from the vault are untouched.
-- ============================================================================
do $$
declare uid uuid;
begin
    select id into uid from auth.users order by created_at limit 1;
    if uid is null then
        raise exception 'No user found. Create your account first (Authentication -> Users).';
    end if;

    delete from public.records where user_id = uid and 'seed' = any(tags);

    insert into public.records
        (user_id, kind, title, venue, meta, year, link, icon, image_url, is_public, sort_order, tags)
    values
    (uid, 'book', 'Convergence of Blockchain, AI and IoT: A Digital Platform', 'CRC Press, Taylor & Francis Group', null, null, 'https://www.routledge.com/Convergence-of-Blockchain-AI-and-IoT-A-Digital-Platform/Balamurugan-Poongodi-R-S-Sharma/p/book/9780367495305', '📕', null, true, 1, array['seed']),
    (uid, 'journal', 'An Efficient Brain Tumor Classification And Segmentation Using Deep Learning Features For ML Algorithms', 'Journal of Neonatal Surgery, Vol. 14 No. 11S, 2025', null, 2025, 'https://www.jneonatalsurg.com/index.php/jns/article/view/3003', '📗', null, true, 2, array['seed']),
    (uid, 'journal', 'Human and Object Detection Deep Learning Model Using R-CNN', 'JISEM, Vol. 10 No. 30s, 2025', null, 2025, 'https://jisem-journal.com/index.php/journal/article/view/4897', '📗', null, true, 3, array['seed']),
    (uid, 'journal', 'Secure and Optimized Communication in the Internet of Things using DNA Cryptography with X.509 Digital Attributes', 'IJETT, 2023, 71(3)', null, 2023, 'https://ijettjournal.org/archive/ijett-v71i3p201', '📗', null, true, 4, array['seed']),
    (uid, 'journal', 'Secure Data Transmission in Smart Cities Using DNA Cryptography with LZW Compression Algorithm', 'Optoelectronics, Instrumentation & Data Processing, Vol. 60, pp. 156–167, 2024', null, 2024, 'https://link.springer.com/article/10.3103/S875669902470016X', '📗', null, true, 5, array['seed']),
    (uid, 'journal', 'Password Attack Resistance using PGRP', 'IJCRD, Vol. 3, Issue 2, 2014', null, 2014, null, '📗', null, true, 6, array['seed']),
    (uid, 'journal', 'Enhanced Multi Owner Security System in Cloud Environment using Offensive (DFD)', 'IJAER, Vol. 10, Issue 38, 2015', null, 2015, 'https://www.academia.edu/33108404/Enhanced_Multi_Owner_Security_System_in_Cloud_Environment_using_Offensive_Digital_Forensics_and_Decoy_Technology_DFD_', '📗', null, true, 7, array['seed']),
    (uid, 'patent', 'Published patent titled "TRACKING GOLD JEWEL USING GOLD JEWEL IDENTIFIER"', 'Published on 12/03/2021', null, 2021, null, '🔖', null, true, 8, array['seed']),
    (uid, 'chapter', 'Taxonomy of Security Attacks in Advances of DNA Computing in Cryptography', 'CRC Press / Chapman & Hall', null, null, 'https://www.taylorfrancis.com/chapters/edit/10.1201/9781351011419-6/taxonomy-security-attacks-dna-computing-selvaraj-karthikeyan-patan-rizwan-balusamy-balamurugan', '📘', null, true, 9, array['seed']),
    (uid, 'chapter', 'Text Mining', 'Natural Language Processing in AI, Apple Academic / CRC Press', null, null, 'https://www.taylorfrancis.com/chapters/edit/10.1201/9780367808495-7/text-mining-karthikeyan-jeevanandam-jotheeswaran-balamurugan-jyotir-moy-chatterjee', '📘', null, true, 10, array['seed']),
    (uid, 'chapter', 'Key Technologies Enabling Big Data Analytics for IoT', 'IoT & Big Data Analytics, CRC Press', null, null, 'https://www.taylorfrancis.com/chapters/edit/10.1201/9781003036739-9/key-technologies-enabling-big-data-analytics-iot-karthikeyan-balamurugan-balusamy-firoz-khan', '📘', null, true, 11, array['seed']),
    (uid, 'chapter', 'Taxonomy of Big Data and Analytics Solutions for Internet of Things', 'IoT & Big Data Analytics, CRC Press', null, null, 'https://www.taylorfrancis.com/chapters/edit/10.1201/9781003036739-1/taxonomy-big-data-analytics-solutions-internet-things-karthikeyan-balamurugan-balusamy-poongodi-firoz-khan', '📘', null, true, 12, array['seed']),
    (uid, 'chapter', 'Internet of Things', 'Blockchain, IoT & AI Handbook, CRC Press', null, null, 'https://www.taylorfrancis.com/chapters/edit/10.1201/9780429352898-3/internet-things-karthikeyan-balamurugan', '📘', null, true, 13, array['seed']),
    (uid, 'chapter', 'Ransomware Attacks in Cyber Space and Mitigation Strategies', 'CRC Press, Taylor & Francis', null, null, 'https://www.taylorfrancis.com/chapters/edit/10.1201/9781003558118-4/ransomware-attacks-cyber-space-mitigation-strategies-rajkumar-karthikeyan-kavitha-hariharan', '📘', null, true, 14, array['seed']),
    (uid, 'conference', 'Predicting Cervical Cancer with Swarm Intelligence: An Innovative CPSO-GA Hybrid Feature Selection Method Using Stacked Ensemble Learning', 'IC3IoT, IEEE, 2024', null, 2024, null, '🎤', null, true, 15, array['seed']),
    (uid, 'conference', 'E-commerce-based Smart Recommendation System using Element-by-Element Collaborative Filtering', 'IC3IoT, IEEE, 2024', null, 2024, 'https://ieeexplore.ieee.org/document/10550386', '🎤', null, true, 16, array['seed']),
    (uid, 'conference', 'Analysis of Customer Churn for Telecom Company with SMOTE-ENN and Hyperparameter Tuning RandomizedSearchCV', 'APCI, IEEE, June 2024', null, 2024, 'https://ieeexplore.ieee.org/document/10617375', '🎤', null, true, 17, array['seed']),
    (uid, 'conference', 'Academates: Your Path to Personalized Learning', 'IC3IoT, IEEE, 2024', null, 2024, 'https://ieeexplore.ieee.org/document/10550203', '🎤', null, true, 18, array['seed']),
    (uid, 'conference', 'Software Defect Classifier Using Linear Regression And Asymmetric Correlation Heatmap', 'APCIT, IEEE, July 2024', null, 2024, 'https://ieeexplore.ieee.org/document/10673531', '🎤', null, true, 19, array['seed']),
    (uid, 'conference', 'Long Short-Term Memory-Based Next Keyword Prediction', 'ESCI, IEEE, Mar 2024', null, 2024, 'https://ieeexplore.ieee.org/document/10497424', '🎤', null, true, 20, array['seed']),
    (uid, 'conference', 'Intelligent Chatbot for Hospital Recommendation System', 'IEEE, Mar 2024', null, 2024, 'https://ieeexplore.ieee.org/document/10488954', '🎤', null, true, 21, array['seed']),
    (uid, 'conference', 'One Stop Mentorship (OSM) – A Mobile Application for Career Development', 'ICAECC, IEEE, 2023', null, 2023, 'https://ieeexplore.ieee.org/document/10560135', '🎤', null, true, 22, array['seed']),
    (uid, 'conference', 'Spypark: The Innovative Mobile Application for Online Parking Reservation', 'ICAECC, IEEE, 2023', null, 2023, 'https://ieeexplore.ieee.org/document/10560130', '🎤', null, true, 23, array['seed']),
    (uid, 'conference', 'An Innovation Development of Decentralized Prove Piercing Data Recuperation Using Improved Red in Mobile Grid Computing', 'ICDCECE, IEEE, Apr 2023', null, 2023, 'https://ieeexplore.ieee.org/document/10150786', '🎤', null, true, 24, array['seed']),
    (uid, 'conference', 'An Intelligent Innovation of Electrochemical Energy Based Smart Industrial Automation', 'ICDCECE, IEEE, Apr 2023', null, 2023, 'https://ieeexplore.ieee.org/document/10151437', '🎤', null, true, 25, array['seed']),
    (uid, 'conference', 'An Exploration on Building of Smart Office through AI and IoT', 'ICERECT, IEEE, Dec 2022', null, 2022, 'https://ieeexplore.ieee.org/document/10059619', '🎤', null, true, 26, array['seed']),
    (uid, 'conference', 'An Investigation on Fat Tree Topology ARP Spoof Detection Using Software Defined Networking', 'ICERECT, IEEE, Dec 2022', null, 2022, 'https://ieeexplore.ieee.org/document/10060657', '🎤', null, true, 27, array['seed']),
    (uid, 'conference', 'Two Dimensional Cellular Automata Encryption Method for Security', 'IC3I, IEEE, Dec 2022', null, 2022, 'https://ieeexplore.ieee.org/document/10072830', '🎤', null, true, 28, array['seed']),
    (uid, 'conference', 'Secured Data Compression and Data Authentication in IoT Networks Using LZW Compression Based X.509 Certification', 'ICDSIS, IEEE, 2022', null, 2022, 'https://ieeexplore.ieee.org/document/9915855', '🎤', null, true, 29, array['seed']),
    (uid, 'conference', 'JU QUERY – Web App for Community-Based Learning', 'ICICICT, IEEE, Oct 2022', null, 2022, 'https://ieeexplore.ieee.org/document/9917861', '🎤', null, true, 30, array['seed']),
    (uid, 'conference', 'AI-Based Content Filtering System Using an Age Prediction Algorithm', 'ICIRCA, IEEE, Sep 2021', null, 2021, 'https://ieeexplore.ieee.org/document/9544100', '🎤', null, true, 31, array['seed']),
    (uid, 'conference', 'Artificial Intelligence Based Comparative Study of Mortality Prediction', 'ICCMC, IEEE, Mar 2020', null, 2020, 'https://ieeexplore.ieee.org/abstract/document/9076379', '🎤', null, true, 32, array['seed']),
    (uid, 'conference', 'Enhancement of Security in the Internet of Things (IoT) by Using X.509 Authentication Mechanism', 'IC3E, Springer, 2018', null, 2018, 'https://link.springer.com/chapter/10.1007/978-981-13-2685-1_22', '🎤', null, true, 33, array['seed']),
    (uid, 'conference', 'Using Social Media for Predictive Data Analytics in Productivity Increasing Decision-Making Process', 'TEST Engineering & Management, Vol. 82, 2020', null, 2020, 'http://www.testmagzine.biz/index.php/testmagzine/article/view/1357', '🎤', null, true, 34, array['seed']),
    (uid, 'conference', 'An Enhanced H-H Routing Protocol to Achieve QoS in Wireless Mesh Network', 'ICTIEM, REC Vellore, 2014', null, 2014, null, '🎤', null, true, 35, array['seed']),
    (uid, 'fdp', 'Convergence of AI, IoT, and Cybersecurity in Industry 4.0', 'Dept. of CSE – Cybersecurity, School of Computer Science & Engineering, Jain (Deemed-to-be University)', null, null, null, '🏅', null, true, 36, array['seed']),
    (uid, 'course', 'SEEK: Self-directed Emotional Learning for Empathy and Kindness', 'UNESCO MGIEP – Mahatma Gandhi Institute of Education for Peace and Sustainable Development', null, null, null, '🕊️', null, true, 37, array['seed']),
    (uid, 'course', 'Teaching and Learning in Engineering', 'NPTEL · IIT Madras', 'NPTEL · Elite + Silver · 79%', null, null, '🥈', null, true, 38, array['seed']),
    (uid, 'course', 'Artificial Intelligence and Deep Learning', 'leadingindia.ai', null, null, null, '🤖', null, true, 39, array['seed']),
    (uid, 'workshop', 'Digital Learning Platform', 'McGraw Hill Education', null, null, null, '📚', null, true, 40, array['seed']),
    (uid, 'fdp', 'Outcome Based Education', 'Galgotias University', null, null, null, '🎯', null, true, 41, array['seed']),
    (uid, 'fdp', 'Nature Inspired Algorithms for Solving Complex Engineering Problems', 'School of Computing Science & Engineering, Galgotias University', null, null, null, '🌿', null, true, 42, array['seed']),
    (uid, 'fdp', 'Engineering Faculty Workshop', 'Wipro Mission 10X · Knowledge Institute of Technology', null, null, null, '⚙️', null, true, 43, array['seed']),
    (uid, 'workshop', 'Entrepreneurship', 'Technology Business Incubator · Kongu Engineering College', null, null, null, '💡', null, true, 44, array['seed']),
    (uid, 'course', 'Salesforce Trailhead', 'ICT Academy · PSG Institute of Technology and Applied Research', null, null, null, '☁️', null, true, 45, array['seed']),
    (uid, 'membership', 'ISTE', 'Indian Society for Technical Education', 'LM109489', null, null, '🎫', 'assets/img/iste-logo.jpg', true, 46, array['seed']),
    (uid, 'membership', 'IAENG', 'International Association of Engineers', '226980', null, null, '🎫', 'assets/img/iaeng-logo.png', true, 47, array['seed']),
    (uid, 'membership', 'CSTA', 'Computer Science Teachers Association', '56589692', null, null, '🎫', 'assets/img/csta-logo.png', true, 48, array['seed']),
    (uid, 'membership', 'ICSES', 'International Computer Science and Engineering Society', '3091', null, null, '🎫', 'assets/img/icses-logo.png', true, 49, array['seed']),
    (uid, 'membership', 'IAIP', 'International Association of Innovation Professionals', '56599797', null, null, '🎫', 'assets/img/iaip-logo.png', true, 50, array['seed']),
    (uid, 'role', 'Project Coordinator for higher semester students', null, '2021–24', null, null, '📌', null, true, 51, array['seed']),
    (uid, 'role', 'MIS / IQAC Coordinator, CSSP Department', null, '2022–23', null, null, '📌', null, true, 52, array['seed']),
    (uid, 'role', 'Content Curation Coordinator', null, '2020–21', null, null, '📌', null, true, 53, array['seed']),
    (uid, 'role', 'Moodle Coordinator for all schools, Galgotias University', null, null, null, null, '📌', null, true, 54, array['seed']),
    (uid, 'role', 'Scintel In-charge — organized events during department Symposium', null, null, null, null, '📌', null, true, 55, array['seed']),
    (uid, 'role', 'Training Coordinator — led training programs and placement drives', null, null, null, null, '📌', null, true, 56, array['seed']),
    (uid, 'role', 'Mentor for Vefetch Technologies startup', null, null, null, null, '📌', null, true, 57, array['seed']);

    raise notice 'Seeded % records', (select count(*) from public.records where user_id = uid and 'seed' = any(tags));
end $$;
