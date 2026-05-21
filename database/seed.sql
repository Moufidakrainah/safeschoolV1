-- Nettoyer les tables
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE report_notes CASCADE;
TRUNCATE TABLE report_victims CASCADE;
TRUNCATE TABLE report_suspects CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE student_parents CASCADE;
TRUNCATE TABLE parents CASCADE;
TRUNCATE TABLE student_profiles CASCADE;
TRUNCATE TABLE staff_classes CASCADE;
TRUNCATE TABLE staff_profiles CASCADE;
TRUNCATE TABLE classes CASCADE;
TRUNCATE TABLE users CASCADE;

-- CLASSES
INSERT INTO classes (id, level, section) VALUES
  ('f0a1b2c3-0000-0000-0000-000000000001', '6eme', 'A'),
  ('f0a1b2c3-0000-0000-0000-000000000002', '6eme', 'B'),
  ('f0a1b2c3-0000-0000-0000-000000000003', '5eme', 'A'),
  ('f0a1b2c3-0000-0000-0000-000000000004', '5eme', 'B'),
  ('f0a1b2c3-0000-0000-0000-000000000005', '4eme', 'A'),
  ('f0a1b2c3-0000-0000-0000-000000000006', '4eme', 'B'),
  ('f0a1b2c3-0000-0000-0000-000000000007', '3eme', 'A'),
  ('f0a1b2c3-0000-0000-0000-000000000008', '3eme', 'B');

-- UTILISATEURS
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", avatar) VALUES
  ('a0b1c2d3-0000-0000-0000-000000000001', 'admin@safeschool.com',     '$2b$10$u3fyxA/ML3ynLXtT66ki9OhcgC40j2GqIIWhhRjWyApGWis3MqTy2', 'Sophie',  'Martin',   'admin',    NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000002', 'directeur@safeschool.com', '$2b$10$ZZLAuASLxIMnzrR9IedJn.zG2gYVBQjhWrkhjbe8tiZEiKL2SrhPO', 'Bernard', 'Dupont',   'director', NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000003', 'prof@safeschool.com',      '$2b$10$yxilnwmyhRgzZHor0M6PteoJ1KpITZIPMyovv0SZ/2uNie9Y15oY6', 'Marie',   'Leroy',    'teacher',  NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000004', 'prof2@safeschool.com',     '$2b$10$FLywd4Mimct8vYT5Ty/mXOvxbqPyibsbgasHENrQh7EIu5gr4mhzC', 'Pierre',  'Durand',   'teacher',  NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000005', 'agent@safeschool.com',     '$2b$10$3.8eHmoj7KEU9nRBZ1VHZOu6CI8ZoaLXoLifQALcvoR75/suSOu5q', 'Fatima',  'Benali',   'staff',    NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000006', 'lotfi@safeschool.com',     '$2b$10$rbXyyCR80klupr.HJz2xSOJXze6ij9Qh25LZ4nPxuXVyneHexoUb6', 'Lotfi',   'Bougrine', 'student',  NOW(), 'bougrine.lotfi.jpg'),
  ('a0b1c2d3-0000-0000-0000-000000000007', 'danya@safeschool.com',     '$2b$10$viOl4rJ733np43se1FrPb.UMkZjUpwoQNgTOQS8ip0lLQ1Pyn.LMK', 'Danya',   'Bougrine', 'student',  NOW(), 'bougrine.danya.jpg'),
  ('a0b1c2d3-0000-0000-0000-000000000008', 'lina@safeschool.com',      '$2b$10$Mnoabi/rcMzGhiqbJWn0mendOhWoIc.e.xLXB4Vl8OZACGt.2Xoiq', 'Lina',    'Bougrine', 'student',  NOW(), 'bougrine.lina.jpg'),
  ('a0b1c2d3-0000-0000-0000-000000000009', 'lucas@safeschool.com',     '$2b$10$ndPa1eFOwa4VH2IVA/7l4ugRKg9Sg341d3Yx7E3iM1xWs3MBce2tu', 'Lucas',   'Bernard',  'student',  NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000010', 'emma@safeschool.com',      '$2b$10$f7PDA.v.BM3aIacSc00Djeu7/.YgvA2wQDcGCg.uJN5xcbvETLvq6', 'Emma',    'Petit',    'student',  NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000011', 'kevin@safeschool.com',     '$2b$10$feBa0AcicF34gPncKMVJFu8F0kUAM2RpFTxlnxJa2Bmq8Kn9jCbXW', 'Kevin',   'Thomas',   'student',  NOW(), NULL),
  ('a0b1c2d3-0000-0000-0000-000000000012', 'sara@safeschool.com',      '$2b$10$8Ajlev4sZJzadv1FU7SAFujVsTl9ht0GKoS7TFu.qSpOBPv3KLGv6', 'Sara',    'Moulin',   'student',  NOW(), NULL);

-- PROFILS ÉLÈVES
INSERT INTO student_profiles (id, "dateOfBirth", "classId", "userId") VALUES
  ('b0c1d2e3-0000-0000-0000-000000000001', '2012-03-15', 'f0a1b2c3-0000-0000-0000-000000000003', 'a0b1c2d3-0000-0000-0000-000000000006'),
  ('b0c1d2e3-0000-0000-0000-000000000002', '2013-06-20', 'f0a1b2c3-0000-0000-0000-000000000005', 'a0b1c2d3-0000-0000-0000-000000000007'),
  ('b0c1d2e3-0000-0000-0000-000000000003', '2014-09-10', 'f0a1b2c3-0000-0000-0000-000000000007', 'a0b1c2d3-0000-0000-0000-000000000008'),
  ('b0c1d2e3-0000-0000-0000-000000000004', '2015-01-05', 'f0a1b2c3-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000009'),
  ('b0c1d2e3-0000-0000-0000-000000000005', '2012-11-25', 'f0a1b2c3-0000-0000-0000-000000000003', 'a0b1c2d3-0000-0000-0000-000000000010'),
  ('b0c1d2e3-0000-0000-0000-000000000006', '2013-04-18', 'f0a1b2c3-0000-0000-0000-000000000005', 'a0b1c2d3-0000-0000-0000-000000000011'),
  ('b0c1d2e3-0000-0000-0000-000000000007', '2015-07-30', 'f0a1b2c3-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000012');

-- PROFILS STAFF
INSERT INTO staff_profiles (id, profession, subject, "userId") VALUES
  ('a0b2d3c9-0000-0000-0000-000000000001', 'enseignant',      'Mathématiques', 'a0b1c2d3-0000-0000-0000-000000000003'),
  ('a0b2d3c9-0000-0000-0000-000000000002', 'enseignant',      'Français',      'a0b1c2d3-0000-0000-0000-000000000004'),
  ('a0b2d3c9-0000-0000-0000-000000000003', 'agent de saisie', NULL,            'a0b1c2d3-0000-0000-0000-000000000005');

-- AFFECTATION STAFF ↔ CLASSES
INSERT INTO staff_classes ("staffProfilesId", "classesId") VALUES
  ('a0b2d3c9-0000-0000-0000-000000000001', 'f0a1b2c3-0000-0000-0000-000000000003'),
  ('a0b2d3c9-0000-0000-0000-000000000001', 'f0a1b2c3-0000-0000-0000-000000000004'),
  ('a0b2d3c9-0000-0000-0000-000000000002', 'f0a1b2c3-0000-0000-0000-000000000005'),
  ('a0b2d3c9-0000-0000-0000-000000000002', 'f0a1b2c3-0000-0000-0000-000000000007');

-- PARENTS
INSERT INTO parents (id, "firstName", "lastName", email, phone, address) VALUES
  ('d8e2a4b2-0000-0000-0000-000000000001', 'Ahmed',  'Bougrine', 'ahmed.bougrine@gmail.com',  '0612345690', '12 rue des Lilas, Lyon'),
  ('d8e2a4b2-0000-0000-0000-000000000002', 'Claire', 'Bernard',  'claire.bernard@gmail.com',  '0612345691', '5 avenue Victor Hugo, Paris'),
  ('d8e2a4b2-0000-0000-0000-000000000003', 'Marc',   'Petit',    'marc.petit@gmail.com',      '0612345692', '8 rue de la Paix, Bordeaux'),
  ('d8e2a4b2-0000-0000-0000-000000000004', 'Sophie', 'Thomas',   'sophie.thomas@gmail.com',   '0612345693', '3 impasse des Roses, Nantes'),
  ('d8e2a4b2-0000-0000-0000-000000000005', 'Pierre', 'Moulin',   'pierre.moulin@gmail.com',   '0612345694', '17 boulevard Gambetta, Marseille');

-- LIAISON PARENTS ↔ ÉLÈVES
INSERT INTO student_parents ("studentProfilesId", "parentsId") VALUES
  ('b0c1d2e3-0000-0000-0000-000000000001', 'd8e2a4b2-0000-0000-0000-000000000001'),
  ('b0c1d2e3-0000-0000-0000-000000000002', 'd8e2a4b2-0000-0000-0000-000000000001'),
  ('b0c1d2e3-0000-0000-0000-000000000003', 'd8e2a4b2-0000-0000-0000-000000000001'),
  ('b0c1d2e3-0000-0000-0000-000000000004', 'd8e2a4b2-0000-0000-0000-000000000002'),
  ('b0c1d2e3-0000-0000-0000-000000000005', 'd8e2a4b2-0000-0000-0000-000000000003'),
  ('b0c1d2e3-0000-0000-0000-000000000006', 'd8e2a4b2-0000-0000-0000-000000000004'),
  ('b0c1d2e3-0000-0000-0000-000000000007', 'd8e2a4b2-0000-0000-0000-000000000005');

-- SIGNALEMENTS
INSERT INTO reports (id, type, reporter, description, grade, "caseNumber", "aiScore", "aiReason", status, "isAnonymous", "studentId", "createdAt") VALUES
  ('c0d1e2f3-0000-0000-0000-000000000001',
   'physique', 'victime',
   'Je me fais frapper tous les jours dans le couloir par un groupe d élèves. Ils me poussent contre les murs et me menacent de me frapper encore plus fort si je le dis à un adulte. J ai très peur d aller à l école. (Fréquence: Tous les jours)',
   'critical', '#2026-001', 85, 'Menace physique et intimidation détectées', 'in_progress', false,
   'a0b1c2d3-0000-0000-0000-000000000006', NOW() - INTERVAL '10 days'),

  ('c0d1e2f3-0000-0000-0000-000000000002',
   'cyber', 'victime',
   'Des élèves ont créé un faux profil avec ma photo sur Instagram et publient des choses humiliantes. Tout le monde se moque de moi à l école depuis. Je ne veux plus venir en cours. (Fréquence: Tous les jours)',
   'high', '#2026-002', 62, 'Cyberharcèlement avec impact psychologique détecté', 'pending', false,
   'a0b1c2d3-0000-0000-0000-000000000007', NOW() - INTERVAL '7 days'),

  ('c0d1e2f3-0000-0000-0000-000000000003',
   'verbal', 'victime',
   'Des élèves se moquent de moi en classe à cause de mes vêtements. Ils rigolent quand je réponds aux questions du professeur et m appellent par des surnoms humiliants. (Fréquence: Trois fois ou plus)',
   'medium', '#2026-003', 38, 'Harcèlement verbal répété détecté', 'pending', false,
   'a0b1c2d3-0000-0000-0000-000000000008', NOW() - INTERVAL '5 days'),

  ('c0d1e2f3-0000-0000-0000-000000000004',
   'physique', 'temoin',
   'J ai vu un élève se faire frapper dans les toilettes par deux autres élèves. La victime pleurait et avait l air très apeurée. Les agresseurs l ont menacé de recommencer s il parlait. (Fréquence: Deux fois)',
   'critical', '#2026-004', 78, 'Violence physique grave avec menaces détectée', 'pending', false,
   'a0b1c2d3-0000-0000-0000-000000000006', NOW() - INTERVAL '3 days'),

  ('c0d1e2f3-0000-0000-0000-000000000005',
   'exclusion', 'victime',
   'Mes camarades refusent de s asseoir à côté de moi en cours et ne m invitent jamais dans leurs groupes de travail. Je mange seule à la cantine depuis le début de l année. (Fréquence: Tous les jours)',
   'medium', '#2026-005', 32, 'Exclusion sociale persistante détectée', 'closed', false,
   'a0b1c2d3-0000-0000-0000-000000000010', NOW() - INTERVAL '15 days'),

  ('c0d1e2f3-0000-0000-0000-000000000006',
   'sexuel', 'victime',
   'Un élève me fait des remarques déplacées sur mon corps tous les jours et a essayé de me toucher dans le couloir. Je me sens très mal à l aise et j ai honte d en parler. (Fréquence: Tous les jours)',
   'critical', '#2026-006', 90, 'Harcèlement sexuel grave détecté — intervention urgente', 'in_progress', false,
   'a0b1c2d3-0000-0000-0000-000000000012', NOW() - INTERVAL '2 days'),

  ('c0d1e2f3-0000-0000-0000-000000000007',
   'verbal', 'temoin',
   'J ai observé en classe qu un élève est systématiquement moqué par ses camarades quand il prend la parole. Les autres élèves l imitent et rient de lui. Cela se passe depuis plusieurs semaines. (Fréquence: Trois fois ou plus)',
   'medium', '#2026-007', 35, 'Harcèlement verbal en classe signalé par témoin', 'in_progress', false,
   'a0b1c2d3-0000-0000-0000-000000000003', NOW() - INTERVAL '6 days');

-- SUSPECTS
INSERT INTO report_suspects (id, "freeText", "resolvedUserId", "reportId") VALUES
  ('d0e1f2a3-0000-0000-0000-000000000001', 'Kevin Thomas - 5eme A',      'a0b1c2d3-0000-0000-0000-000000000011', 'c0d1e2f3-0000-0000-0000-000000000001'),
  ('d0e1f2a3-0000-0000-0000-000000000002', 'Rayan Saidi - 5eme A',       NULL,                                   'c0d1e2f3-0000-0000-0000-000000000001'),
  ('d0e1f2a3-0000-0000-0000-000000000003', 'Groupe inconnu Instagram',   NULL,                                   'c0d1e2f3-0000-0000-0000-000000000002'),
  ('d0e1f2a3-0000-0000-0000-000000000004', 'Kevin Thomas - 4eme A',      'a0b1c2d3-0000-0000-0000-000000000011', 'c0d1e2f3-0000-0000-0000-000000000003'),
  ('d0e1f2a3-0000-0000-0000-000000000005', 'Mehdi Karim - 6eme B',       NULL,                                   'c0d1e2f3-0000-0000-0000-000000000004'),
  ('d0e1f2a3-0000-0000-0000-000000000006', 'Axel Morin - 6eme B',        NULL,                                   'c0d1e2f3-0000-0000-0000-000000000004'),
  ('d0e1f2a3-0000-0000-0000-000000000007', 'Thomas Girard - 4eme A',     NULL,                                   'c0d1e2f3-0000-0000-0000-000000000006'),
  ('d0e1f2a3-0000-0000-0000-000000000008', 'Kevin Thomas - 4eme A',      'a0b1c2d3-0000-0000-0000-000000000011', 'c0d1e2f3-0000-0000-0000-000000000007');

-- VICTIMES (uniquement pour les signalements de témoins)
INSERT INTO report_victims (id, "freeText", "resolvedUserId", "reportId") VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Lucas Bernard - 6eme A', 'a0b1c2d3-0000-0000-0000-000000000009', 'c0d1e2f3-0000-0000-0000-000000000004'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Emma Petit - 5eme A',    'a0b1c2d3-0000-0000-0000-000000000010', 'c0d1e2f3-0000-0000-0000-000000000007');

-- NOTES
INSERT INTO report_notes (id, content, type, "createdAt", "reportId", "authorId") VALUES
  ('e0f1a2b3-0000-0000-0000-000000000001',
   'Dossier pris en charge. Convocation des parents prévue pour la semaine prochaine.',
   'note', NOW() - INTERVAL '9 days',
   'c0d1e2f3-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000001'),

  ('e0f1a2b3-0000-0000-0000-000000000002',
   'Vous êtes convoqué(e) le 20/04/2026 à 14h00 dans le bureau de la direction concernant un dossier de harcèlement scolaire. Merci de vous présenter accompagné(e) de vos parents.',
   'convocation', NOW() - INTERVAL '8 days',
   'c0d1e2f3-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000001'),

  ('e0f1a2b3-0000-0000-0000-000000000003',
   'Entretien avec la victime réalisé. Témoignage recueilli. Les parents ont été informés.',
   'note', NOW() - INTERVAL '5 days',
   'c0d1e2f3-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000001'),

  ('e0f1a2b3-0000-0000-0000-000000000004',
   'Médiation organisée entre les élèves concernés. Situation résolue après discussion.',
   'note', NOW() - INTERVAL '1 day',
   'c0d1e2f3-0000-0000-0000-000000000005', 'a0b1c2d3-0000-0000-0000-000000000001');