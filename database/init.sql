CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(50) NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'pending',
  user_id     INT REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW()
);
