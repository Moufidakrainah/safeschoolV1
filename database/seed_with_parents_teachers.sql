CREATE EXTENSION IF NOT EXISTS "pgcrypto";



-- ─────────────────────────────────────────
-- 1. DROP (ordre inverse : les tables dépendantes en premier)
-- ─────────────────────────────────────────
DROP TABLE IF EXISTS notifications        CASCADE;
DROP TABLE IF EXISTS report_notes         CASCADE;
DROP TABLE IF EXISTS report_suspects      CASCADE;
DROP TABLE IF EXISTS reports              CASCADE;
DROP TABLE IF EXISTS student_parents      CASCADE;
DROP TABLE IF EXISTS student_profiles     CASCADE;
DROP TABLE IF EXISTS parents_profiles     CASCADE;
DROP TABLE IF EXISTS major_profiles       CASCADE;
DROP TABLE IF EXISTS classes              CASCADE;
DROP TABLE IF EXISTS users               CASCADE;

-- ─────────────────────────────────────────
--  2. CRÉATION DES TABLES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY,
  email       TEXT     NOT NULL UNIQUE,
  password    TEXT     NOT NULL,
  role        VARCHAR     NOT NULL CHECK (role IN ('admin','director','teacher','staff','moderator','student')),
  "firstName" VARCHAR     NOT NULL,
  "lastName"  VARCHAR     NOT NULL,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Profil des personnels (enseignants, direction, staff…)
CREATE TABLE IF NOT EXISTS major_profiles (
  id         UUID    PRIMARY KEY,
  "userId"   UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profession VARCHAR,
  subjects   VARCHAR
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id      UUID    PRIMARY KEY,
  level   VARCHAR NOT NULL,   -- ex: "6eme"
  section VARCHAR NOT NULL    -- ex: "A"
);

-- Profils parents
CREATE TABLE IF NOT EXISTS parents_profiles (
  id       UUID    PRIMARY KEY,
  address  VARCHAR,
  postcode VARCHAR,
  city     VARCHAR,
  phone    VARCHAR,
  email    VARCHAR
);

-- Profils élèves
CREATE TABLE IF NOT EXISTS student_profiles (
  id            UUID    PRIMARY KEY,
  "userId"      UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "dateOfBirth" DATE,
  "classId"     UUID    REFERENCES classes(id) ON DELETE SET NULL
);

-- Table de jointure élève ↔ parents (N:N)
-- Un élève peut avoir 2 parents ; un parent peut avoir plusieurs enfants.
CREATE TABLE IF NOT EXISTS student_parents (
  "studentId" UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  "parentId"  UUID NOT NULL REFERENCES parents_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY ("studentId", "parentId")
);

-- Signalements
CREATE TABLE IF NOT EXISTS reports (
  id                       UUID        PRIMARY KEY,
  title                    VARCHAR     NOT NULL,
  description              TEXT,
  grade                    VARCHAR     NOT NULL CHECK (grade IN ('moyen','grave','critique')),
  "caseNumber"             VARCHAR     UNIQUE,
  "aiScore"                INTEGER,
  "aiReason"               TEXT,
  "gradeModified"          BOOLEAN     NOT NULL DEFAULT FALSE,
  "gradeModificationReason" TEXT,
  status                   VARCHAR     NOT NULL CHECK (status IN ('pending','in_progress','escalated','closed')),
  "adminNote"              TEXT,
  "isAnonymous"            BOOLEAN     NOT NULL DEFAULT FALSE,
  "studentId"              UUID        REFERENCES users(id) ON DELETE SET NULL,
  "createdAt"              TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Suspects liés à un signalement
CREATE TABLE IF NOT EXISTS report_suspects (
  id         UUID    PRIMARY KEY,
  "reportId" UUID    NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  "userId"   UUID    REFERENCES users(id) ON DELETE SET NULL,
  "freeText" TEXT
);

-- Notes internes sur un signalement
CREATE TABLE IF NOT EXISTS report_notes (
  id         UUID      PRIMARY KEY,
  content    TEXT      NOT NULL,
  type       VARCHAR   NOT NULL CHECK (type IN ('note','convocation')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "reportId" UUID      NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  "authorId" UUID      REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"   UUID      REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT,
  read       BOOLEAN   NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
--  3. DONNÉES — USERS
-- ─────────────────────────────────────────

INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt") VALUES
  ('a0b1c2d3-0000-0000-0000-000000000001', 'admin@safeschool.com',     '$2b$10$u3fyxA/ML3ynLXtT66ki9OhcgC40j2GqIIWhhRjWyApGWis3MqTy2', 'Sophie',  'Martin',   'admin',    NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000002', 'directeur@safeschool.com', '$2b$10$ZZLAuASLxIMnzrR9IedJn.zG2gYVBQjhWrkhjbe8tiZEiKL2SrhPO', 'Bernard', 'Dupont',   'director', NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000003', 'prof@safeschool.com',      '$2b$10$yxilnwmyhRgzZHor0M6PteoJ1KpITZIPMyovv0SZ/2uNie9Y15oY6', 'Marie',   'Leroy',    'teacher',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000004', 'prof2@safeschool.com',     '$2b$10$FLywd4Mimct8vYT5Ty/mXOvxbqPyibsbgasHENrQh7EIu5gr4mhzC', 'Pierre',  'Durand',   'teacher',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000005', 'agent@safeschool.com',     '$2b$10$3.8eHmoj7KEU9nRBZ1VHZOu6CI8ZoaLXoLifQALcvoR75/suSOu5q', 'Fatima',  'Benali',   'staff',    NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000006', 'lotfi@safeschool.com',     '$2b$10$rbXyyCR80klupr.HJz2xSOJXze6ij9Qh25LZ4nPxuXVyneHexoUb6', 'Lotfi',   'Bougrine', 'student',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000007', 'danya@safeschool.com',     '$2b$10$viOl4rJ733np43se1FrPb.UMkZjUpwoQNgTOQS8ip0lLQ1Pyn.LMK', 'Danya',   'Bougrine', 'student',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000008', 'lina@safeschool.com',      '$2b$10$Mnoabi/rcMzGhiqbJWn0mendOhWoIc.e.xLXB4Vl8OZACGt.2Xoiq', 'Lina',    'Bougrine', 'student',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000009', 'lucas@safeschool.com',     '$2b$10$ndPa1eFOwa4VH2IVA/7l4ugRKg9Sg341d3Yx7E3iM1xWs3MBce2tu', 'Lucas',   'Bernard',  'student',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000010', 'emma@safeschool.com',      '$2b$10$f7PDA.v.BM3aIacSc00Djeu7/.YgvA2wQDcGCg.uJN5xcbvETLvq6', 'Emma',    'Petit',    'student',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000011', 'kevin@safeschool.com',     '$2b$10$feBa0AcicF34gPncKMVJFu8F0kUAM2RpFTxlnxJa2Bmq8Kn9jCbXW', 'Kevin',   'Thomas',   'student',  NOW()),
  ('a0b1c2d3-0000-0000-0000-000000000012', 'sara@safeschool.com',      '$2b$10$8Ajlev4sZJzadv1FU7SAFujVsTl9ht0GKoS7TFu.qSpOBPv3KLGv6', 'Sara',    'Moulin',   'student',  NOW());

-- ─────────────────────────────────────────
--  4. PROFILS MAJEURS (personnel)
-- ─────────────────────────────────────────

INSERT INTO major_profiles (id, "userId", profession, subjects) VALUES
  ('f0a1b2c3-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000001', 'Administrateur',     NULL),
  ('f0a1b2c3-0000-0000-0000-000000000002', 'a0b1c2d3-0000-0000-0000-000000000002', 'Directeur',          NULL),
  ('f0a1b2c3-0000-0000-0000-000000000003', 'a0b1c2d3-0000-0000-0000-000000000003', 'Professeur',         'Mathématiques, Sciences'),
  ('f0a1b2c3-0000-0000-0000-000000000004', 'a0b1c2d3-0000-0000-0000-000000000004', 'Professeur',         'Français, Histoire-Géo'),
  ('f0a1b2c3-0000-0000-0000-000000000005', 'a0b1c2d3-0000-0000-0000-000000000005', 'Agent de service',   NULL);

-- ─────────────────────────────────────────
--  5. CLASSES
-- ─────────────────────────────────────────

INSERT INTO classes (id, level, section) VALUES
  ('c1a2b3c4-0000-0000-0000-000000000001', '6eme', 'A'),
  ('c1a2b3c4-0000-0000-0000-000000000002', '6eme', 'B'),
  ('c1a2b3c4-0000-0000-0000-000000000003', '5eme', 'A'),
  ('c1a2b3c4-0000-0000-0000-000000000004', '5eme', 'B'),
  ('c1a2b3c4-0000-0000-0000-000000000005', '4eme', 'A'),
  ('c1a2b3c4-0000-0000-0000-000000000006', '4eme', 'B'),
  ('c1a2b3c4-0000-0000-0000-000000000007', '3eme', 'A');

-- ─────────────────────────────────────────
--  6. PROFILS PARENTS
--     Chaque élève a 2 parents distincts.
--     UUIDs pp-xxx-01 = parent 1, pp-xxx-02 = parent 2
-- ─────────────────────────────────────────

INSERT INTO parents_profiles (id, address, postcode, city, phone, email) VALUES
  -- Parents de Lotfi Bougrine
  ('aa000001-0000-0000-0000-000000000001', '12 rue des Lilas',     '90000', 'Belfort', '0612345678', 'karim.bougrine@gmail.com'),
  ('aa000001-0000-0000-0000-000000000002', '12 rue des Lilas',     '90000', 'Belfort', '0687654321', 'amina.bougrine@gmail.com'),
  -- Parents de Danya Bougrine (même famille)
  ('aa000002-0000-0000-0000-000000000001', '12 rue des Lilas',     '90000', 'Belfort', '0612345678', 'karim.bougrine@gmail.com'),
  ('aa000002-0000-0000-0000-000000000002', '12 rue des Lilas',     '90000', 'Belfort', '0687654321', 'amina.bougrine@gmail.com'),
  -- Parents de Lina Bougrine (même famille)
  ('aa000003-0000-0000-0000-000000000001', '12 rue des Lilas',     '90000', 'Belfort', '0612345678', 'karim.bougrine@gmail.com'),
  ('aa000003-0000-0000-0000-000000000002', '12 rue des Lilas',     '90000', 'Belfort', '0687654321', 'amina.bougrine@gmail.com'),
  -- Parents de Lucas Bernard
  ('aa000004-0000-0000-0000-000000000001', '5 avenue Carnot',      '90000', 'Belfort', '0612345681', 'jean.bernard@gmail.com'),
  ('aa000004-0000-0000-0000-000000000002', '5 avenue Carnot',      '90000', 'Belfort', '0698765432', 'claire.bernard@gmail.com'),
  -- Parents de Emma Petit
  ('aa000005-0000-0000-0000-000000000001', '8 rue Victor Hugo',    '90000', 'Belfort', '0612345682', 'marc.petit@gmail.com'),
  ('aa000005-0000-0000-0000-000000000002', '8 rue Victor Hugo',    '90000', 'Belfort', '0611223344', 'julie.petit@gmail.com'),
  -- Parents de Kevin Thomas
  ('aa000006-0000-0000-0000-000000000001', '3 impasse du Moulin',  '90100', 'Delle',   '0612345683', 'eric.thomas@gmail.com'),
  ('aa000006-0000-0000-0000-000000000002', '3 impasse du Moulin',  '90100', 'Delle',   '0699887766', 'nathalie.thomas@gmail.com'),
  -- Parents de Sara Moulin
  ('aa000007-0000-0000-0000-000000000001', '17 rue de la Paix',    '90000', 'Belfort', '0612345684', 'paul.moulin@gmail.com'),
  ('aa000007-0000-0000-0000-000000000002', '17 rue de la Paix',    '90000', 'Belfort', '0655443322', 'sylvie.moulin@gmail.com');

-- ─────────────────────────────────────────
--  7. PROFILS ÉLÈVES
-- ─────────────────────────────────────────
-- Correspondance niveau → classId :
--   5eme A → c1a2b3c4-...-0003  (Lotfi)
--   4eme A → c1a2b3c4-...-0005  (Danya)
--   3eme A → c1a2b3c4-...-0007  (Lina)
--   6eme A → c1a2b3c4-...-0001  (Lucas)
--   5eme B → c1a2b3c4-...-0004  (Emma)
--   4eme B → c1a2b3c4-...-0006  (Kevin)
--   6eme B → c1a2b3c4-...-0002  (Sara)

INSERT INTO student_profiles (id, "userId", "dateOfBirth", "classId") VALUES
  ('bb000001-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000006', '2012-03-15', 'c1a2b3c4-0000-0000-0000-000000000003'),
  ('bb000002-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000007', '2013-06-20', 'c1a2b3c4-0000-0000-0000-000000000005'),
  ('bb000003-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000008', '2014-09-10', 'c1a2b3c4-0000-0000-0000-000000000007'),
  ('bb000004-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000009', '2015-01-05', 'c1a2b3c4-0000-0000-0000-000000000001'),
  ('bb000005-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000010', '2012-11-25', 'c1a2b3c4-0000-0000-0000-000000000004'),
  ('bb000006-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000011', '2013-04-18', 'c1a2b3c4-0000-0000-0000-000000000006'),
  ('bb000007-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000012', '2015-07-30', 'c1a2b3c4-0000-0000-0000-000000000002');

-- ─────────────────────────────────────────
--  8. TABLE DE JOINTURE ÉLÈVE ↔ PARENTS
--     Lotfi, Danya et Lina partagent les mêmes parents (famille Bougrine).
-- ─────────────────────────────────────────

INSERT INTO student_parents ("studentId", "parentId") VALUES
  -- Lotfi Bougrine
  ('bb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001'),
  ('bb000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000002'),
  -- Danya Bougrine
  ('bb000002-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000001'),
  ('bb000002-0000-0000-0000-000000000001', 'aa000002-0000-0000-0000-000000000002'),
  -- Lina Bougrine
  ('bb000003-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000001'),
  ('bb000003-0000-0000-0000-000000000001', 'aa000003-0000-0000-0000-000000000002'),
  -- Lucas Bernard
  ('bb000004-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000001'),
  ('bb000004-0000-0000-0000-000000000001', 'aa000004-0000-0000-0000-000000000002'),
  -- Emma Petit
  ('bb000005-0000-0000-0000-000000000001', 'aa000005-0000-0000-0000-000000000001'),
  ('bb000005-0000-0000-0000-000000000001', 'aa000005-0000-0000-0000-000000000002'),
  -- Kevin Thomas
  ('bb000006-0000-0000-0000-000000000001', 'aa000006-0000-0000-0000-000000000001'),
  ('bb000006-0000-0000-0000-000000000001', 'aa000006-0000-0000-0000-000000000002'),
  -- Sara Moulin
  ('bb000007-0000-0000-0000-000000000001', 'aa000007-0000-0000-0000-000000000001'),
  ('bb000007-0000-0000-0000-000000000001', 'aa000007-0000-0000-0000-000000000002');

-- ─────────────────────────────────────────
--  9. SIGNALEMENTS
-- ─────────────────────────────────────────

INSERT INTO reports (id, title, description, grade, "caseNumber", "aiScore", "aiReason", "gradeModified", "gradeModificationReason", status, "adminNote", "isAnonymous", "studentId", "createdAt") VALUES
  ('c0d1e2f3-0000-0000-0000-000000000001',
   'Physique - Je suis victime',
   'Je me fais frapper tous les jours dans le couloir par un groupe d élèves. Ils me poussent contre les murs et me menacent de me frapper encore plus fort si je le dis à un adulte. J ai très peur d aller à l école. (Fréquence: Tous les jours)',
   'critique', '#2026-001', 85, 'Menace physique et intimidation détectées', false, NULL, 'in_progress', NULL, false,
   'a0b1c2d3-0000-0000-0000-000000000006', NOW() - INTERVAL '10 days'),

  ('c0d1e2f3-0000-0000-0000-000000000002',
   'Cyber - Je suis victime',
   'Des élèves ont créé un faux profil avec ma photo sur Instagram et publient des choses humiliantes. Tout le monde se moque de moi à l école depuis. Je ne veux plus venir en cours. (Fréquence: Tous les jours)',
   'grave', '#2026-002', 62, 'Cyberharcèlement avec impact psychologique détecté', false, NULL, 'pending', NULL, false,
   'a0b1c2d3-0000-0000-0000-000000000007', NOW() - INTERVAL '7 days'),

  ('c0d1e2f3-0000-0000-0000-000000000003',
   'Verbal - Je suis victime',
   'Des élèves se moquent de moi en classe à cause de mes vêtements. Ils rigolent quand je réponds aux questions du professeur et m appellent par des surnoms humiliants. (Fréquence: Trois fois ou plus)',
   'moyen', '#2026-003', 38, 'Harcèlement verbal répété détecté', false, NULL, 'pending', NULL, false,
   'a0b1c2d3-0000-0000-0000-000000000008', NOW() - INTERVAL '5 days'),

  ('c0d1e2f3-0000-0000-0000-000000000004',
   'Physique - Je suis témoin',
   'J ai vu un élève se faire frapper dans les toilettes par deux autres élèves. La victime pleurait et avait l air très apeurée. Les agresseurs l ont menacé de recommencer s il parlait. | Victime : Lucas Bernard (Fréquence: Deux fois)',
   'critique', '#2026-004', 78, 'Violence physique grave avec menaces détectée', false, NULL, 'pending', NULL, false,
   'a0b1c2d3-0000-0000-0000-000000000006', NOW() - INTERVAL '3 days'),

  ('c0d1e2f3-0000-0000-0000-000000000005',
   'Exclusion sociale - Je suis victime',
   'Mes camarades refusent de s asseoir à côté de moi en cours et ne m invitent jamais dans leurs groupes de travail. Je mange seule à la cantine depuis le début de l année. (Fréquence: Tous les jours)',
   'moyen', '#2026-005', 32, 'Exclusion sociale persistante détectée', false, NULL, 'closed', 'Dossier traité après médiation entre élèves le 05/04/2026', false,
   'a0b1c2d3-0000-0000-0000-000000000010', NOW() - INTERVAL '15 days'),

  ('c0d1e2f3-0000-0000-0000-000000000006',
   'Sexuel - Je suis victime',
   'Un élève me fait des remarques déplacées sur mon corps tous les jours et a essayé de me toucher dans le couloir. Je me sens très mal à l aise et j ai honte d en parler. (Fréquence: Tous les jours)',
   'critique', '#2026-006', 90, 'Harcèlement sexuel grave détecté — intervention urgente', false, NULL, 'escalated', NULL, false,
   'a0b1c2d3-0000-0000-0000-000000000012', NOW() - INTERVAL '2 days'),

  ('c0d1e2f3-0000-0000-0000-000000000007',
   'Verbal - Je suis professeur',
   'J ai observé en classe qu un élève est systématiquement moqué par ses camarades quand il prend la parole. Les autres élèves l imitent et rient de lui. Cela se passe depuis plusieurs semaines. | Victime : Emma Petit (Fréquence: Trois fois ou plus)',
   'moyen', '#2026-007', 35, 'Harcèlement verbal en classe signalé par enseignant', false, NULL, 'in_progress', NULL, false,
   'a0b1c2d3-0000-0000-0000-000000000003', NOW() - INTERVAL '6 days');

-- ─────────────────────────────────────────
--  10. SUSPECTS
-- ─────────────────────────────────────────

INSERT INTO report_suspects (id, "reportId", "userId", "freeText") VALUES
  ('d0e1f2a3-0000-0000-0000-000000000001', 'c0d1e2f3-0000-0000-0000-000000000001', 'a0b1c2d3-0000-0000-0000-000000000011', NULL),
  ('d0e1f2a3-0000-0000-0000-000000000002', 'c0d1e2f3-0000-0000-0000-000000000001', NULL, 'Rayan Saidi - 5eme A'),
  ('d0e1f2a3-0000-0000-0000-000000000003', 'c0d1e2f3-0000-0000-0000-000000000002', NULL, 'Groupe inconnu Instagram'),
  ('d0e1f2a3-0000-0000-0000-000000000004', 'c0d1e2f3-0000-0000-0000-000000000003', 'a0b1c2d3-0000-0000-0000-000000000011', NULL),
  ('d0e1f2a3-0000-0000-0000-000000000005', 'c0d1e2f3-0000-0000-0000-000000000004', NULL, 'Mehdi Karim - 6eme B'),
  ('d0e1f2a3-0000-0000-0000-000000000006', 'c0d1e2f3-0000-0000-0000-000000000004', NULL, 'Axel Morin - 6eme B'),
  ('d0e1f2a3-0000-0000-0000-000000000007', 'c0d1e2f3-0000-0000-0000-000000000006', NULL, 'Thomas Girard - 4eme A'),
  ('d0e1f2a3-0000-0000-0000-000000000008', 'c0d1e2f3-0000-0000-0000-000000000007', 'a0b1c2d3-0000-0000-0000-000000000011', NULL);

-- ─────────────────────────────────────────
--  11. NOTES
-- ─────────────────────────────────────────

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