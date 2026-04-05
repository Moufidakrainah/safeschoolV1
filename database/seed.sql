TRUNCATE TABLE reports RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (email, password, role, "firstName", "lastName", "createdAt") VALUES
  ('admin@safeschool.com', '$2b$10$zJVzXEfxFfFacayoXR2BqeqjrDnmj1U3mlO3rqU.wrqjD8AtjI.OW', 'admin', 'Admin', 'School', NOW()),
  ('eleve@safeschool.com', '$2b$10$jgplORnuXkVf426kqwOriuzxKcMbqMGXei8IYfiHvX.z/sEuj/SJK', 'student', 'Lotfi', 'Bougrine', NOW()),
  ('directeur@safeschool.com', '$2b$10$F61t5GfDkq1VIzvvNtdvC.QEs9EF0wgz0BB5UNNGKqBTthjelHRpa', 'director', 'Directeur', 'School', NOW());

INSERT INTO reports (title, description, grade, "gradeModified", "gradeModificationReason", status, "adminNote", "isAnonymous", "studentId", "createdAt") VALUES
  ('Harcelement dans la cour', 'Un eleve me frappe et me menace tous les jours', 'critical', false, NULL, 'pending', NULL, false, 2, NOW()),
  ('Insultes repetees', 'Je me fais insulter et harceler depuis plusieurs semaines', 'urgent', false, NULL, 'in_progress', 'Dossier en cours de traitement', false, 2, NOW()),
  ('Moqueries en classe', 'Des eleves se moquent de moi devant tout le monde', 'serious', false, NULL, 'pending', NULL, true, 2, NOW()),
  ('Atmosphere tendue', 'Je me sens mal a laise en cours sans raison precise', 'watch', false, NULL, 'pending', NULL, false, 2, NOW());