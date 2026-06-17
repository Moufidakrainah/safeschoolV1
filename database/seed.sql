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

-- ══════════════════════════════════════════════════════════
-- CLASSES
-- ══════════════════════════════════════════════════════════
INSERT INTO classes (id, level, section) VALUES
  ('9a1d3640-4f0b-445b-be95-6525ee15f1ab', '6eme', 'A'),
  ('5525fddb-12a5-41c4-8351-7111d0df44a5', '6eme', 'B'),
  ('912e5362-2d60-48e2-a831-84f72672870b', '5eme', 'A'),
  ('7d0ce352-c54d-400d-93e6-c7be8ee7014f', '5eme', 'B'),
  ('31339b21-a968-4468-9876-07c9780a4c97', '4eme', 'A'),
  ('597ef964-d1dd-47cb-82fe-5e4f39a6256e', '4eme', 'B'),
  ('980848b2-2e03-475a-8e9f-b91ab0841217', '3eme', 'A'),
  ('a3da0c80-838c-4c9e-a8f1-ea2753be4ed8', '3eme', 'B');

-- ══════════════════════════════════════════════════════════
-- UTILISATEURS
-- Mots de passe :
--   admin   → ADMINadmin123123+
--   teacher → PROFprof123123+
--   student → ELEVEeleve123123+
-- ══════════════════════════════════════════════════════════
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", avatar) VALUES
  ('4a0f185a-d3b7-4403-a9d2-3ffbdfcdb1c0', 'admin@safeschool.com',  '$2b$10$ZlV/HvmWiTwVyGWfItPjXO1cM4uFwMYdDs5SAz.fMQRHtOj0/mZs6', 'Sophie',  'MARTIN',   'admin',   NOW(), NULL),
  ('d3a33eb4-71e7-4d86-8bcc-bdd25ee1382d', 'prof@safeschool.com',   '$2b$10$mHT5tlxMzIpUxBSDqejVAuijCX3vmtLMo8idHOpxBn93h3FJ9dpWq', 'Marie',   'LEROY',    'teacher', NOW(), NULL),
  ('0a246544-f2f6-42b4-9028-e51bb96c846c', 'prof2@safeschool.com',  '$2b$10$mHT5tlxMzIpUxBSDqejVAuijCX3vmtLMo8idHOpxBn93h3FJ9dpWq', 'Pierre',  'DURAND',   'teacher', NOW(), NULL),
  ('cb43ce40-e5e3-4aa7-8609-e6f8c9b1e98f', 'lotfi@safeschool.com',  '$2b$10$qO85lleK19YaU2JiD2S1re8w/ObulwT4/6Z02FJxjoGVcmMRk.cqW', 'Lotfi',   'BOUGRINE', 'student', NOW(), 'bougrine.lotfi.jpg'),
  ('dee345e7-2e64-48d2-9ed9-07a84ab342a5', 'danya@safeschool.com',  '$2b$10$qO85lleK19YaU2JiD2S1re8w/ObulwT4/6Z02FJxjoGVcmMRk.cqW', 'Danya',   'BOUGRINE', 'student', NOW(), 'bougrine.danya.jpg'),
  ('77df6cdc-cfe3-4fbd-b741-8476b8f2840d', 'lina@safeschool.com',   '$2b$10$qO85lleK19YaU2JiD2S1re8w/ObulwT4/6Z02FJxjoGVcmMRk.cqW', 'Lina',    'BOUGRINE', 'student', NOW(), 'bougrine.lina.jpg'),
  ('d94e92d5-4f02-4197-9ed9-a6330cc027af', 'lucas@safeschool.com',  '$2b$10$qO85lleK19YaU2JiD2S1re8w/ObulwT4/6Z02FJxjoGVcmMRk.cqW', 'Lucas',   'BERNARD',  'student', NOW(), NULL),
  ('f3c61912-5404-4fe2-ac09-a3539a306f46', 'emma@safeschool.com',   '$2b$10$qO85lleK19YaU2JiD2S1re8w/ObulwT4/6Z02FJxjoGVcmMRk.cqW', 'Emma',    'PETIT',    'student', NOW(), NULL),
  ('a03f6870-c5df-4d66-b735-b16f72c5dd78', 'kevin@safeschool.com',  '$2b$10$qO85lleK19YaU2JiD2S1re8w/ObulwT4/6Z02FJxjoGVcmMRk.cqW', 'Kevin',   'THOMAS',   'student', NOW(), NULL),
  ('216f54a0-bea2-497a-8c4f-f283c6f2cde2', 'sara@safeschool.com',   '$2b$10$qO85lleK19YaU2JiD2S1re8w/ObulwT4/6Z02FJxjoGVcmMRk.cqW', 'Sara',    'MOULIN',   'student', NOW(), NULL);

-- ══════════════════════════════════════════════════════════
-- PROFILS ÉLÈVES
-- ══════════════════════════════════════════════════════════
INSERT INTO student_profiles (id, "dateOfBirth", "classId", "userId") VALUES
  ('f8f313cf-4b2d-4a74-ad72-ce80950afb4b', '2012-03-15', '912e5362-2d60-48e2-a831-84f72672870b', 'cb43ce40-e5e3-4aa7-8609-e6f8c9b1e98f'),
  ('2e400ca2-1fa5-4cb8-8ae8-4ba695470f51', '2013-06-20', '31339b21-a968-4468-9876-07c9780a4c97', 'dee345e7-2e64-48d2-9ed9-07a84ab342a5'),
  ('31517ba9-91ac-4798-8eb8-86b7ca3cce56', '2014-09-10', '980848b2-2e03-475a-8e9f-b91ab0841217', '77df6cdc-cfe3-4fbd-b741-8476b8f2840d'),
  ('e72493ba-88a3-4976-afda-3d91f0b87519', '2015-01-05', '9a1d3640-4f0b-445b-be95-6525ee15f1ab', 'd94e92d5-4f02-4197-9ed9-a6330cc027af'),
  ('57e8c7b6-7807-4bf2-926c-27bf6ad66635', '2012-11-25', '912e5362-2d60-48e2-a831-84f72672870b', 'f3c61912-5404-4fe2-ac09-a3539a306f46'),
  ('515ecb20-6ffa-456e-af50-110c494d069d', '2013-04-18', '31339b21-a968-4468-9876-07c9780a4c97', 'a03f6870-c5df-4d66-b735-b16f72c5dd78'),
  ('c795d1b1-9632-4dc3-9517-7532a81d20b7', '2015-07-30', '9a1d3640-4f0b-445b-be95-6525ee15f1ab', '216f54a0-bea2-497a-8c4f-f283c6f2cde2');

-- ══════════════════════════════════════════════════════════
-- PROFILS STAFF
-- ══════════════════════════════════════════════════════════
INSERT INTO staff_profiles (id, profession, subject, "userId") VALUES
  ('0bb2ee5f-0f20-4fa0-aef3-d53090f60d3e', 'enseignant', 'Mathématiques', 'd3a33eb4-71e7-4d86-8bcc-bdd25ee1382d'),
  ('440b8488-b6ae-472b-bfe2-4130c9d7a8c9', 'enseignant', 'Français',      '0a246544-f2f6-42b4-9028-e51bb96c846c');

INSERT INTO staff_classes ("staffProfilesId", "classesId") VALUES
  ('0bb2ee5f-0f20-4fa0-aef3-d53090f60d3e', '912e5362-2d60-48e2-a831-84f72672870b'),
  ('0bb2ee5f-0f20-4fa0-aef3-d53090f60d3e', '7d0ce352-c54d-400d-93e6-c7be8ee7014f'),
  ('440b8488-b6ae-472b-bfe2-4130c9d7a8c9', '31339b21-a968-4468-9876-07c9780a4c97'),
  ('440b8488-b6ae-472b-bfe2-4130c9d7a8c9', '980848b2-2e03-475a-8e9f-b91ab0841217');

-- ══════════════════════════════════════════════════════════
-- PARENTS
-- ══════════════════════════════════════════════════════════
INSERT INTO parents (id, "firstName", "lastName", email, phone, address) VALUES
  ('18b3feb7-2f37-4738-9540-81ce4aeef420', 'Riad',    'BOUGRINE', 'riad.bougrine@gmail.com',   '0612345690', '12 rue des Lilas, 69001 Lyon'),
  ('113c3069-aa94-496a-8148-3f9f8f7abaef', 'Moufida', 'KRAINAH',  'moufida.krainah@gmail.com', '0612345691', '12 rue des Lilas, 69001 Lyon'),
  ('dd0f8213-3c75-4d29-b63f-f0c457aabe25', 'Claire',  'BERNARD',  'claire.bernard@gmail.com',  '0612345692', '5 avenue Victor Hugo, 75016 Paris'),
  ('acf47f66-a585-4a95-9910-563454a05a5b', 'Marc',    'PETIT',    'marc.petit@gmail.com',      '0612345693', '8 rue de la Paix, 33000 Bordeaux'),
  ('86f55da4-956c-43b9-846c-4920bdaba0dd', 'Sophie',  'THOMAS',   'sophie.thomas@gmail.com',   '0612345694', '3 impasse des Roses, 44000 Nantes'),
  ('ea22457c-4df2-4928-8210-14c15450282f', 'Pierre',  'MOULIN',   'pierre.moulin@gmail.com',   '0612345695', '17 boulevard Gambetta, 13001 Marseille');

-- ══════════════════════════════════════════════════════════
-- LIAISON PARENTS ↔ ÉLÈVES
-- ══════════════════════════════════════════════════════════
INSERT INTO student_parents ("studentProfilesId", "parentsId") VALUES
  ('f8f313cf-4b2d-4a74-ad72-ce80950afb4b', '18b3feb7-2f37-4738-9540-81ce4aeef420'),
  ('f8f313cf-4b2d-4a74-ad72-ce80950afb4b', '113c3069-aa94-496a-8148-3f9f8f7abaef'),
  ('2e400ca2-1fa5-4cb8-8ae8-4ba695470f51', '18b3feb7-2f37-4738-9540-81ce4aeef420'),
  ('2e400ca2-1fa5-4cb8-8ae8-4ba695470f51', '113c3069-aa94-496a-8148-3f9f8f7abaef'),
  ('31517ba9-91ac-4798-8eb8-86b7ca3cce56', '18b3feb7-2f37-4738-9540-81ce4aeef420'),
  ('31517ba9-91ac-4798-8eb8-86b7ca3cce56', '113c3069-aa94-496a-8148-3f9f8f7abaef'),
  ('e72493ba-88a3-4976-afda-3d91f0b87519', 'dd0f8213-3c75-4d29-b63f-f0c457aabe25'),
  ('57e8c7b6-7807-4bf2-926c-27bf6ad66635', 'acf47f66-a585-4a95-9910-563454a05a5b'),
  ('515ecb20-6ffa-456e-af50-110c494d069d', '86f55da4-956c-43b9-846c-4920bdaba0dd'),
  ('c795d1b1-9632-4dc3-9517-7532a81d20b7', 'ea22457c-4df2-4928-8210-14c15450282f');

-- ══════════════════════════════════════════════════════════
-- SIGNALEMENTS
-- ══════════════════════════════════════════════════════════
INSERT INTO reports (id, type, reporter, description, grade, "caseNumber", "aiScore", "aiReason", status, "isAnonymous", "studentId", "createdAt") VALUES
  ('dc93b694-377b-433c-b61d-ff8ac9aad9d3', 'physique', 'victime',
   'Je me fais frapper tous les jours dans le couloir par un groupe d élèves. Ils me poussent contre les murs et me menacent de me frapper encore plus fort si je le dis à un adulte. J ai très peur d aller à l école. (Fréquence: Tous les jours)',
   'critical', '#2026-001', 85, 'Menace physique et intimidation détectées', 'in_progress', false, 'cb43ce40-e5e3-4aa7-8609-e6f8c9b1e98f', NOW() - INTERVAL '10 days'),

  ('5f43ca0d-913c-4887-8f44-a1e5286d62cf', 'cyber', 'victime',
   'Des élèves ont créé un faux profil avec ma photo sur Instagram et publient des choses humiliantes. Tout le monde se moque de moi à l école depuis. Je ne veux plus venir en cours. (Fréquence: Tous les jours)',
   'high', '#2026-002', 62, 'Cyberharcèlement avec impact psychologique détecté', 'new', false, 'dee345e7-2e64-48d2-9ed9-07a84ab342a5', NOW() - INTERVAL '7 days'),

  ('ef2a31d7-010e-4221-b015-70a6a008a989', 'verbal', 'victime',
   'Des élèves se moquent de moi en classe à cause de mes vêtements. Ils rigolent quand je réponds aux questions du professeur et m appellent par des surnoms humiliants. (Fréquence: Trois fois ou plus)',
   'medium', '#2026-003', 38, 'Harcèlement verbal répété détecté', 'in_progress', false, '77df6cdc-cfe3-4fbd-b741-8476b8f2840d', NOW() - INTERVAL '5 days'),

  ('bd3bf56f-4ae6-4dfc-bb64-9989c3140882', 'physique', 'temoin',
   'J ai vu un élève se faire frapper dans les toilettes par deux autres élèves. La victime pleurait et avait l air très apeurée. Les agresseurs l ont menacé de recommencer s il parlait. (Fréquence: Deux fois)',
   'critical', '#2026-004', 78, 'Violence physique grave avec menaces détectée', 'new', false, 'cb43ce40-e5e3-4aa7-8609-e6f8c9b1e98f', NOW() - INTERVAL '3 days'),

  ('f3af856c-cead-4fe7-8e3f-331ad7865637', 'exclusion', 'victime',
   'Mes camarades refusent de s asseoir à côté de moi en cours et ne m invitent jamais dans leurs groupes de travail. Je mange seule à la cantine depuis le début de l année. (Fréquence: Tous les jours)',
   'medium', '#2026-005', 32, 'Exclusion sociale persistante détectée', 'resolved', false, 'f3c61912-5404-4fe2-ac09-a3539a306f46', NOW() - INTERVAL '15 days'),

  ('b72217f8-2bfa-42bc-92f3-8677e6ac0e97', 'sexuel', 'victime',
   'Un élève me fait des remarques déplacées sur mon corps tous les jours et a essayé de me toucher dans le couloir. Je me sens très mal à l aise et j ai honte d en parler. (Fréquence: Tous les jours)',
   'critical', '#2026-006', 90, 'Harcèlement sexuel grave détecté — intervention urgente', 'in_progress', false, '216f54a0-bea2-497a-8c4f-f283c6f2cde2', NOW() - INTERVAL '2 days'),

  ('a42c30fa-d0e6-4ff6-af0e-a24d1e543114', 'verbal', 'temoin',
   'J ai observé en classe qu un élève est systématiquement moqué par ses camarades quand il prend la parole. Les autres élèves l imitent et rient de lui. Cela se passe depuis plusieurs semaines. (Fréquence: Trois fois ou plus)',
   'medium', '#2026-007', 35, 'Harcèlement verbal en classe signalé par témoin', 'in_progress', false, 'd3a33eb4-71e7-4d86-8bcc-bdd25ee1382d', NOW() - INTERVAL '6 days');

-- ══════════════════════════════════════════════════════════
-- SUSPECTS
-- ══════════════════════════════════════════════════════════
INSERT INTO report_suspects (id, "freeText", "resolvedUserId", "reportId") VALUES
  ('cdc9ae8b-de04-4dc7-a72f-9ab385c33c11', 'Kevin THOMAS',  'a03f6870-c5df-4d66-b735-b16f72c5dd78', 'dc93b694-377b-433c-b61d-ff8ac9aad9d3'),
  ('dba53182-139d-4869-97b2-c1da6d1c9426', 'Rayan SAIDI',   NULL,                                   'dc93b694-377b-433c-b61d-ff8ac9aad9d3'),
  ('aff5c81b-4e5c-4cb3-8284-fb87699178df', 'Jack MILL',     NULL,                                   '5f43ca0d-913c-4887-8f44-a1e5286d62cf'),
  ('e20ad4f4-dce8-49b2-90d7-10b224f8be45', 'Kevin THOMAS',  'a03f6870-c5df-4d66-b735-b16f72c5dd78', 'ef2a31d7-010e-4221-b015-70a6a008a989'),
  ('fa94cb6d-cbb9-45de-9a5e-b0c3cfbf2175', 'Mehdi KARIM',   NULL,                                   'bd3bf56f-4ae6-4dfc-bb64-9989c3140882'),
  ('9ed52c7b-a120-4d37-9613-eac6100e0a14', 'Axel MORIN',    NULL,                                   'bd3bf56f-4ae6-4dfc-bb64-9989c3140882'),
  ('4b360d30-a1dd-4df4-a0c8-745577372617', 'Thomas GIRARD', NULL,                                   'b72217f8-2bfa-42bc-92f3-8677e6ac0e97'),
  ('46ba8b31-9c9e-440d-b690-bb8410a08660', 'Kevin THOMAS',  'a03f6870-c5df-4d66-b735-b16f72c5dd78', 'a42c30fa-d0e6-4ff6-af0e-a24d1e543114');

-- ══════════════════════════════════════════════════════════
-- VICTIMES
-- ══════════════════════════════════════════════════════════
INSERT INTO report_victims (id, "freeText", "resolvedUserId", "reportId") VALUES
  ('46174d6e-a0c8-458b-bbba-9a0d50ef5f97', 'Lucas BERNARD', 'd94e92d5-4f02-4197-9ed9-a6330cc027af', 'bd3bf56f-4ae6-4dfc-bb64-9989c3140882'),
  ('b1419036-e00e-427e-9025-f6f38f4fc391', 'Emma PETIT',    'f3c61912-5404-4fe2-ac09-a3539a306f46', 'a42c30fa-d0e6-4ff6-af0e-a24d1e543114');

-- ══════════════════════════════════════════════════════════
-- NOTES
-- ══════════════════════════════════════════════════════════
INSERT INTO report_notes (id, content, type, "createdAt", "reportId", "authorId") VALUES
  ('c299c0b2-f140-40bc-afb8-fadccd8c441e',
   'Dossier pris en charge. Convocation des parents prévue pour la semaine prochaine.',
   'note', NOW() - INTERVAL '9 days', 'dc93b694-377b-433c-b61d-ff8ac9aad9d3', '4a0f185a-d3b7-4403-a9d2-3ffbdfcdb1c0'),

  ('9ed52c7b-a120-4d37-9613-eac6100e0a14',
   'Lotfi BOUGRINE est convoqué(e) le 20 avril 2026 à 14:00

Tu es convoqué(e) le 20/04/2026 à 14h00 dans le bureau de la direction concernant un dossier de harcèlement scolaire. Merci de te présenter accompagné(e) de tes parents.',
   'convocation', NOW() - INTERVAL '8 days', 'dc93b694-377b-433c-b61d-ff8ac9aad9d3', '4a0f185a-d3b7-4403-a9d2-3ffbdfcdb1c0'),

  ('4b360d30-a1dd-4df4-a0c8-745577372617',
   'Entretien avec la victime réalisé. Témoignage recueilli. Les parents ont été informés.',
   'note', NOW() - INTERVAL '5 days', 'dc93b694-377b-433c-b61d-ff8ac9aad9d3', '4a0f185a-d3b7-4403-a9d2-3ffbdfcdb1c0'),

  ('46ba8b31-9c9e-440d-b690-bb8410a08660',
   'Médiation organisée entre les élèves concernés. Situation résolue après discussion.',
   'note', NOW() - INTERVAL '1 day', 'f3af856c-cead-4fe7-8e3f-331ad7865637', '4a0f185a-d3b7-4403-a9d2-3ffbdfcdb1c0');