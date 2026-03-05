-- ================================================
-- Permanent Stories for Demo/Guest Users
-- expires_at = 2099 so they never expire
-- Run after seed-data.sql
-- ================================================

-- Stories from Alice (user 001) - Photography & Travel
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001',
   'Golden hour in NYC! The city never sleeps but the sunsets are worth pausing for',
   'https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 12, 5, NOW() - interval '2 hours', NOW(), 'SEED', 'SEED'),

  ('c0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001',
   NULL,
   'https://images.unsplash.com/photo-1502786129293-79981df4e689?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 8, 3, NOW() - interval '6 hours', NOW(), 'SEED', 'SEED');

-- Stories from Bob (user 002) - Dev Life
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000002',
   'Just shipped a new feature! Feels amazing when everything works on the first try',
   NULL, 'text', '#6366f1',
   '2099-12-31 23:59:59+00', 15, 7, NOW() - interval '1 hour', NOW(), 'SEED', 'SEED'),

  ('c0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000002',
   NULL,
   'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 10, 4, NOW() - interval '4 hours', NOW(), 'SEED', 'SEED');

-- Stories from Charlie (user 003) - Coffee & Books
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000003',
   'Morning coffee + a good book = perfect start to the day',
   'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 9, 6, NOW() - interval '3 hours', NOW(), 'SEED', 'SEED');

-- Stories from Diana (user 004) - Fitness
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000004',
   'Sunrise yoga session! Starting the day with positive energy',
   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 20, 11, NOW() - interval '5 hours', NOW(), 'SEED', 'SEED'),

  ('c0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000004',
   'New personal record! Never give up on your fitness goals',
   NULL, 'text', '#ec4899',
   '2099-12-31 23:59:59+00', 18, 9, NOW() - interval '8 hours', NOW(), 'SEED', 'SEED');

-- Stories from Ethan (user 005) - Adventure
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000005',
   NULL,
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 25, 14, NOW() - interval '1 hour', NOW(), 'SEED', 'SEED'),

  ('c0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000005',
   'Life begins at the end of your comfort zone! Just jumped off a cliff (with a parachute of course)',
   NULL, 'text', '#f59e0b',
   '2099-12-31 23:59:59+00', 22, 12, NOW() - interval '7 hours', NOW(), 'SEED', 'SEED');

-- Stories from Fiona (user 006) - Art
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000006',
   'Work in progress... new painting coming soon!',
   'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 14, 8, NOW() - interval '2 hours', NOW(), 'SEED', 'SEED');

-- Stories from Hannah (user 008) - Food
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000008',
   'Homemade ramen from scratch! 12 hours of broth simmering was so worth it',
   'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 30, 16, NOW() - interval '3 hours', NOW(), 'SEED', 'SEED'),

  ('c0000001-0000-4000-a000-000000000012', 'a0000001-0000-4000-a000-000000000008',
   'Recipe testing day! Stay tuned for something special',
   NULL, 'text', '#10b981',
   '2099-12-31 23:59:59+00', 11, 5, NOW() - interval '9 hours', NOW(), 'SEED', 'SEED');

-- Stories from Julia (user 010) - Movies
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000010',
   'Movie marathon weekend! What should I watch next?',
   'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=1067&fit=crop', 'image', NULL,
   '2099-12-31 23:59:59+00', 17, 7, NOW() - interval '4 hours', NOW(), 'SEED', 'SEED');

SELECT 'Permanent stories inserted: ' || COUNT(*) FROM stories WHERE expires_at > '2099-01-01';
