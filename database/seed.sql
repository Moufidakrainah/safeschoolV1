TRUNCATE TABLE reports RESTART IDENTITY CASCADE;
TRUNCATE TABLE student_profiles RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (id, email, password, role, "firstName", "lastName", "createdAt") VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'admin@safeschool.com', '$2b$10$zJVzXEfxFfFacayoXR2BqeqjrDnmj1U3mlO3rqU.wrqjD8AtjI.OW', 'admin', 'Admin', 'School', NOW()),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'eleve@safeschool.com', '$2b$10$jgplORnuXkVf426kqwOriuzxKcMbqMGXei8IYfiHvX.z/sEuj/SJK', 'student', 'Lotfi', 'Bougrine', NOW()),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'directeur@safeschool.com', '$2b$10$F61t5GfDkq1VIzvvNtdvC.QEs9EF0wgz0BB5UNNGKqBTthjelHRpa', 'director', 'Directeur', 'School', NOW()),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'eleve2@safeschool.com', '$2b$10$jgplORnuXkVf426kqwOriuzxKcMbqMGXei8IYfiHvX.z/sEuj/SJK', 'student', 'Danya', 'Bougrine', NOW()),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'eleve3@safeschool.com', '$2b$10$jgplORnuXkVf426kqwOriuzxKcMbqMGXei8IYfiHvX.z/sEuj/SJK', 'student', 'Lina', 'Bougrine', NOW());

INSERT INTO student_profiles (id, "parentEmail", "parentPhone", class, "dateOfBirth", "userId") VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', 'parent.lotfi@gmail.com',   '0612345678', '5eme', '2012-03-15', 'a1b2c3d4-0002-0002-0002-000000000002'),
  ('b1b2c3d4-0002-0002-0002-000000000002', 'parent.danya@gmail.com',   '0623456789', '4eme', '2011-07-22', 'a1b2c3d4-0004-0004-0004-000000000004'),
  ('b1b2c3d4-0003-0003-0003-000000000003', 'parent.lina@gmail.com',    '0634567890', '3eme', '2010-11-05', 'a1b2c3d4-0005-0005-0005-000000000005');

INSERT INTO reports (id, title, description, grade, "gradeModified", "gradeModificationReason", status, "adminNote", "isAnonymous", "studentId", "createdAt") VALUES
  ('c1b2c3d4-0001-0001-0001-000000000001', 'Harcelement dans la cour', 'Un eleve me frappe et me menace tous les jours', 'critical', false, NULL, 'pending', NULL, false, 'a1b2c3d4-0002-0002-0002-000000000002', NOW()),
  ('c1b2c3d4-0002-0002-0002-000000000002', 'Insultes repetees', 'Je me fais insulter et harceler depuis plusieurs semaines', 'urgent', false, NULL, 'in_progress', 'Dossier en cours de traitement', false, 'a1b2c3d4-0002-0002-0002-000000000002', NOW()),
  ('c1b2c3d4-0003-0003-0003-000000000003', 'Moqueries en classe', 'Des eleves se moquent de moi devant tout le monde', 'serious', false, NULL, 'pending', NULL, true, 'a1b2c3d4-0004-0004-0004-000000000004', NOW()),
  ('c1b2c3d4-0004-0004-0004-000000000004', 'Atmosphere tendue', 'Je me sens mal a laise en cours sans raison precise', 'watch', false, NULL, 'pending', NULL, false, 'a1b2c3d4-0005-0005-0005-000000000005', NOW());