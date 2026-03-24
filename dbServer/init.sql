CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    age INTEGER,
    gender VARCHAR(50),
    profile_picture INTEGER,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))
);

CREATE TYPE campaign_tag AS ENUM (
    'Humanitær',
    'Sundhed',
    'Natur og miljø',
    'Uddannelse',
    'Fritid',
    'Personlig'
);

CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags campaign_tag[],
    goal DECIMAL(15, 2),
    is_complete BOOLEAN DEFAULT FALSE,
    milestones TEXT[],
    city_name VARCHAR(100),
    owner_ids INTEGER[] DEFAULT '{}',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    data BYTEA NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    uploaded_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

ALTER TABLE users ADD CONSTRAINT fk_profile_picture FOREIGN KEY (profile_picture) REFERENCES images(id);

CREATE TABLE campaign_images (
    campaign_id INTEGER NOT NULL,
    image_id INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (campaign_id, image_id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (image_id) REFERENCES images(id)
);


CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    from_user INTEGER NOT NULL,
    to_campaign INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user) REFERENCES users(id),
    FOREIGN KEY (to_campaign) REFERENCES campaigns(id)
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    from_user INTEGER NOT NULL,
    to_campaign INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    stripe_subscription_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user) REFERENCES users(id),
    FOREIGN KEY (to_campaign) REFERENCES campaigns(id)
);

CREATE TABLE user_cpr (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    cpr_number VARCHAR(11) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- pg_cron: delete CPR records older than 6 months, runs daily at midnight
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
    'delete-expired-cpr',
    '0 0 * * *',
    $$DELETE FROM user_cpr WHERE created_at < NOW() - INTERVAL '6 months'$$
);

-- Seed admin user (password: Admin1234 — change before production)
INSERT INTO users (username, email, firstname, surname, password_hash, role)
VALUES ('admin', 'admin@example.com', 'Admin', 'User', '$2b$10$7PdXeMEyecQMai65cEq54.j2oW7b5nQal/FGvVH5TDv/BdpFR6MUy', 'admin');
