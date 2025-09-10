CREATE DATABASE IF NOT EXISTS disaster_management;
USE disaster_management;

CREATE TABLE IF NOT EXISTS police_stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_name VARCHAR(255) NOT NULL,
    inspector_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    telephone_1 VARCHAR(15) DEFAULT NULL,
    telephone_2 VARCHAR(15) DEFAULT NULL,
    email_id VARCHAR(255) DEFAULT NULL,
    address TEXT NOT NULL,
    police_chowkis TEXT DEFAULT NULL
);

INSERT INTO police_stations (
    station_name, inspector_name, mobile_number, telephone_1, telephone_2, 
    email_id, address, police_chowkis
) VALUES 
('Alankar Police Station', 'Sunita Rokade', '9511793639', '02025445003', '02027487777', 'ps.alankar-pune@gov.in', 'P-16, Alankar Pool Road, Bharatkunj - 1, Erandwane, Pune 411052', 'Alankar (02026208430), Dahanukar (NA)'),
('Ambegaon Police Station', 'Sharad Zine', '8888813301', NULL, NULL, NULL, 'Sarve no 12, San Fantyaci Society, Near Leck Vista Society, Saninagar Chock, Ambegaon Khurd, Pune', NULL),
('Baner Police Station', 'Navnath Jagtap', '9850158810', NULL, NULL, NULL, 'Siemens Company, Balewadi High Street, Baner, Balewadi, Pune', NULL),
('Bharti Vidyapeeth Police Station', 'Savalaram Salgavkar', '9821537314', '02024365100', '02024488633', 'psbvpeeth.pune@nic.in', 'In Front of Bharati Vidyapeeth, Pune.', 'Bharati Vidyapeeth (NA), Katraj (02024317770), Ambegaon Pathar (NA), Dattanagar (NA)'),
('Bibwewadi Police Station', 'Shankar Salunkhe', '8888813154', '02024282003', '02026898111', 'ps.bibwewadi-pune@nic.in', 'SR. No. 670, Swami Vivekanand Road, Bibwewadi, Pune-411037.', 'Bibwewadi (NA), Upper Indiranagar (02024280356)'),
('Bundgarden Police Station', 'Ravindra Gaikwad', '9689286565', '02026208226', '02026362612', 'psbundgarden.pune@nic.in', 'Bundgarden Police Station, Near New Collector Office, Pune-411001.', 'Pune Station (02026069304), Tadiwala Road (NA), Council Hall (02026208339)'),
('Chandan Nagar Police Station', 'Seema Dhakane', '8888830714', '02027012321', '02025819562', 'pschandannagar.pune@nic.in', 'S NO 37, Behind Sundarabai Marathe School, Old Mundhwa Road, Chandan Nagar, Pune-411014', 'Mahatma Phule (NA), Shivrana Pratap (02027010100), Kharadi (NA)'),
('Chaturshringi Police Station', 'Vijayanad Patil', '8108800381', '02025655335', '02025886272', 'pscshrungi.pune@nic.in', 'Chaturshringi Police Station, Ganesh Khind Road, In Front Of Rajbhavan, Pune -411007.', 'Pandavnagar (02025665763), Janawadi (02025665764), Poona Gate (NA), Pashan (NA), Aundh (2025881611)'),
('Deccan Police Station', 'Girisha Nimbalkar', '9823246444', '02025675005', '02024452671', 'psdeccan.pune@nic.in', '759/5, Prabhat Road, Deccan Gymkhana, Pune-411004', 'Balgandharv (NA), Prabhat (02025666313)'),
('Faraskhana Police Station', 'Prashant Bhasme', '7387080768', '02024452250', '02024452623', 'psfaraskhana.pune@nic.in', 'Faraskhana Police Station, 146 Budhwar Peth, Near Dagdusheth Ganpati Temple, Pune.', 'Shukravar Peth (02024477671), Sattoti (02024571333), Gadital (02026111013), Raviwar Peth (02024454521), Ganesh Peth (2026050336), Kasaba Peth (2024576571)');
