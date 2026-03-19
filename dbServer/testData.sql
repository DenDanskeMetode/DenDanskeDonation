-- Insert test users with the new schema
INSERT INTO users (username, email, firstname, surname, password_hash, age, gender)
VALUES
  ('johndoe', 'john@example.com', 'John', 'Doe', 'hashedpassword123', 30, 'male'),
  ('janedoe', 'jane@example.com', 'Jane', 'Doe', 'hashedpassword456', 28, 'female'),
  ('bobsmith', 'bob@example.com', 'Bob', 'Smith', 'hashedpassword789', 35, 'male');

-- Insert test campaigns with the new schema
INSERT INTO campaigns (title, description, tags, goal, is_complete, milestones, city_name, created_by)
VALUES
  ('Clean Water Initiative', 'Providing clean water to rural communities', ARRAY['water', 'health', 'rural'], 50000.00, FALSE, ARRAY['Phase 1: Assessment', 'Phase 2: Implementation'], 'Nairobi', 1),
  ('Education for All', 'Building schools and providing educational materials', ARRAY['education', 'children', 'schools'], 75000.00, FALSE, ARRAY['Fundraising', 'Construction', 'Hiring Teachers'], 'Accra', 2),
  ('Reforestation Project', 'Planting trees to combat deforestation', ARRAY['environment', 'trees', 'sustainability'], 30000.00, FALSE, ARRAY['Land Preparation', 'Planting', 'Maintenance'], 'Lagos', 3);

-- Insert test donations linking users to campaigns
INSERT INTO donations (from_user, to_campaign, amount)
VALUES 
  (1, 1, 1000.00),  -- John Doe donates to Clean Water Initiative
  (1, 2, 1500.00),  -- John Doe donates to Education for All
  (2, 1, 750.00),   -- Jane Doe donates to Clean Water Initiative
  (2, 3, 500.00),   -- Jane Doe donates to Reforestation Project
  (3, 2, 2000.00),  -- Bob Smith donates to Education for All
  (3, 3, 1200.00);  -- Bob Smith donates to Reforestation Project