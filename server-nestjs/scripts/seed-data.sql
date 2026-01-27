-- Full Seed Data for PingUp
-- 30 Users, 65 Posts, Comments, Stories, Messages, Connections, Notifications, Bookmarks
-- All users are PUBLIC, all images are UNIQUE

-- ============================================
-- FIX MISSING TABLES/COLUMNS FIRST
-- ============================================
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- Create comment_likes table if not exists
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);

-- ============================================
-- CLEAN UP ALL DATA (TRUNCATE with CASCADE)
-- ============================================
TRUNCATE TABLE
  comment_likes,
  post_likes,
  story_views,
  story_likes,
  user_followers,
  bookmarks,
  notifications,
  comments,
  posts,
  stories,
  messages,
  connections,
  group_messages,
  group_members,
  group_chats,
  blocked_users,
  reports,
  chat_settings,
  users
CASCADE;

-- ============================================
-- 1. CREATE 30 USERS (ALL PUBLIC)
-- ============================================
DO $$
DECLARE
  pwd_hash TEXT := '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
BEGIN
  INSERT INTO users (id, email, full_name, username, password, bio, location, profile_picture, cover_photo, is_private, created_at, updated_at, created_by, updated_by)
  VALUES
    ('a0000001-0000-4000-a000-000000000001', 'alice@demo.com', 'Alice Johnson', 'alice_j', pwd_hash, 'Love photography and travel. Always seeking new adventures!', 'New York, USA', 'https://i.pravatar.cc/200?u=alice1', 'https://picsum.photos/seed/cover1/800/300', false, NOW() - interval '90 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000002', 'bob@demo.com', 'Bob Smith', 'bobsmith', pwd_hash, 'Software developer by day, gamer by night. Coffee addict.', 'San Francisco, USA', 'https://i.pravatar.cc/200?u=bob2', 'https://picsum.photos/seed/cover2/800/300', false, NOW() - interval '88 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000003', 'charlie@demo.com', 'Charlie Brown', 'charlie_b', pwd_hash, 'Coffee addict and book lover. Tech enthusiast.', 'London, UK', 'https://i.pravatar.cc/200?u=charlie3', 'https://picsum.photos/seed/cover3/800/300', false, NOW() - interval '86 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000004', 'diana@demo.com', 'Diana Prince', 'diana_p', pwd_hash, 'Fitness enthusiast. Yoga instructor. Healthy living advocate.', 'Los Angeles, USA', 'https://i.pravatar.cc/200?u=diana4', 'https://picsum.photos/seed/cover4/800/300', false, NOW() - interval '84 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000005', 'ethan@demo.com', 'Ethan Hunt', 'ethan_h', pwd_hash, 'Adventure seeker. Travel blogger. Extreme sports lover.', 'Sydney, Australia', 'https://i.pravatar.cc/200?u=ethan5', 'https://picsum.photos/seed/cover5/800/300', false, NOW() - interval '82 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000006', 'fiona@demo.com', 'Fiona Green', 'fiona_g', pwd_hash, 'Artist and dreamer. Painting is my therapy.', 'Paris, France', 'https://i.pravatar.cc/200?u=fiona6', 'https://picsum.photos/seed/cover6/800/300', false, NOW() - interval '80 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000007', 'george@demo.com', 'George Wilson', 'george_w', pwd_hash, 'Music producer. Beats maker. Sound designer.', 'Berlin, Germany', 'https://i.pravatar.cc/200?u=george7', 'https://picsum.photos/seed/cover7/800/300', false, NOW() - interval '78 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000008', 'hannah@demo.com', 'Hannah Lee', 'hannah_l', pwd_hash, 'Food blogger. Recipe creator. Kitchen experiments daily!', 'Tokyo, Japan', 'https://i.pravatar.cc/200?u=hannah8', 'https://picsum.photos/seed/cover8/800/300', false, NOW() - interval '76 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000009', 'ivan@demo.com', 'Ivan Petrov', 'ivan_p', pwd_hash, 'Tech entrepreneur. Startup founder. AI enthusiast.', 'Moscow, Russia', 'https://i.pravatar.cc/200?u=ivan9', 'https://picsum.photos/seed/cover9/800/300', false, NOW() - interval '74 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000010', 'julia@demo.com', 'Julia Roberts', 'julia_r', pwd_hash, 'Movie lover. Film critic. Cinema is life.', 'Toronto, Canada', 'https://i.pravatar.cc/200?u=julia10', 'https://picsum.photos/seed/cover10/800/300', false, NOW() - interval '72 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000011', 'kevin@demo.com', 'Kevin Hart', 'kevin_h', pwd_hash, 'Stand-up comedy fan. Laughter is the best medicine!', 'Chicago, USA', 'https://i.pravatar.cc/200?u=kevin11', 'https://picsum.photos/seed/cover11/800/300', false, NOW() - interval '70 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000012', 'lisa@demo.com', 'Lisa Simpson', 'lisa_s', pwd_hash, 'Environmental activist. Plant lover. Save the planet!', 'Seattle, USA', 'https://i.pravatar.cc/200?u=lisa12', 'https://picsum.photos/seed/cover12/800/300', false, NOW() - interval '68 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000013', 'mike@demo.com', 'Mike Johnson', 'mike_j', pwd_hash, 'Sports enthusiast. Basketball player. Never give up!', 'Miami, USA', 'https://i.pravatar.cc/200?u=mike13', 'https://picsum.photos/seed/cover13/800/300', false, NOW() - interval '66 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000014', 'nancy@demo.com', 'Nancy Drew', 'nancy_d', pwd_hash, 'Mystery book writer. Detective stories lover.', 'Boston, USA', 'https://i.pravatar.cc/200?u=nancy14', 'https://picsum.photos/seed/cover14/800/300', false, NOW() - interval '64 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000015', 'oscar@demo.com', 'Oscar Martinez', 'oscar_m', pwd_hash, 'Accountant and film critic. Numbers and movies.', 'Mexico City, Mexico', 'https://i.pravatar.cc/200?u=oscar15', 'https://picsum.photos/seed/cover15/800/300', false, NOW() - interval '62 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000016', 'penny@demo.com', 'Penny Lane', 'penny_l', pwd_hash, 'Music journalist. Concert goer. Vinyl collector.', 'Nashville, USA', 'https://i.pravatar.cc/200?u=penny16', 'https://picsum.photos/seed/cover16/800/300', false, NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000017', 'quinn@demo.com', 'Quinn Hughes', 'quinn_h', pwd_hash, 'Hockey player. Ice is my second home.', 'Vancouver, Canada', 'https://i.pravatar.cc/200?u=quinn17', 'https://picsum.photos/seed/cover17/800/300', false, NOW() - interval '58 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000018', 'rachel@demo.com', 'Rachel Green', 'rachel_g', pwd_hash, 'Fashion designer. Style is a way of life.', 'Milan, Italy', 'https://i.pravatar.cc/200?u=rachel18', 'https://picsum.photos/seed/cover18/800/300', false, NOW() - interval '56 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000019', 'steve@demo.com', 'Steve Rogers', 'steve_r', pwd_hash, 'Fitness trainer. Helping others achieve their goals.', 'Brooklyn, USA', 'https://i.pravatar.cc/200?u=steve19', 'https://picsum.photos/seed/cover19/800/300', false, NOW() - interval '54 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000020', 'tina@demo.com', 'Tina Turner', 'tina_t', pwd_hash, 'Singer and performer. Music is my soul.', 'Memphis, USA', 'https://i.pravatar.cc/200?u=tina20', 'https://picsum.photos/seed/cover20/800/300', false, NOW() - interval '52 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000021', 'uma@demo.com', 'Uma Thurman', 'uma_t', pwd_hash, 'Action movie enthusiast. Martial arts practitioner.', 'Austin, USA', 'https://i.pravatar.cc/200?u=uma21', 'https://picsum.photos/seed/cover21/800/300', false, NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000022', 'victor@demo.com', 'Victor Hugo', 'victor_h', pwd_hash, 'Writer and poet. Words are my weapon.', 'Lyon, France', 'https://i.pravatar.cc/200?u=victor22', 'https://picsum.photos/seed/cover22/800/300', false, NOW() - interval '48 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000023', 'wendy@demo.com', 'Wendy Williams', 'wendy_w', pwd_hash, 'Talk show host. Gossip queen. Entertainment lover.', 'New Jersey, USA', 'https://i.pravatar.cc/200?u=wendy23', 'https://picsum.photos/seed/cover23/800/300', false, NOW() - interval '46 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000024', 'xavier@demo.com', 'Xavier Chen', 'xavier_c', pwd_hash, 'Data scientist. Machine learning expert. Tech geek.', 'Singapore', 'https://i.pravatar.cc/200?u=xavier24', 'https://picsum.photos/seed/cover24/800/300', false, NOW() - interval '44 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000025', 'yuki@demo.com', 'Yuki Tanaka', 'yuki_t', pwd_hash, 'Anime artist. Manga creator. Japanese culture lover.', 'Osaka, Japan', 'https://i.pravatar.cc/200?u=yuki25', 'https://picsum.photos/seed/cover25/800/300', false, NOW() - interval '42 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000026', 'zara@demo.com', 'Zara Khan', 'zara_k', pwd_hash, 'Fashion influencer. Travel addict. Lifestyle blogger.', 'Dubai, UAE', 'https://i.pravatar.cc/200?u=zara26', 'https://picsum.photos/seed/cover26/800/300', false, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000027', 'adam@demo.com', 'Adam Scott', 'adam_s', pwd_hash, 'Golf pro. Sports commentator. Outdoor enthusiast.', 'Phoenix, USA', 'https://i.pravatar.cc/200?u=adam27', 'https://picsum.photos/seed/cover27/800/300', false, NOW() - interval '38 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000028', 'bella@demo.com', 'Bella Swan', 'bella_s', pwd_hash, 'Book worm. Nature lover. Quiet life appreciator.', 'Portland, USA', 'https://i.pravatar.cc/200?u=bella28', 'https://picsum.photos/seed/cover28/800/300', false, NOW() - interval '36 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000029', 'carlos@demo.com', 'Carlos Garcia', 'carlos_g', pwd_hash, 'Chef extraordinaire. Food is art. Culinary adventures.', 'Barcelona, Spain', 'https://i.pravatar.cc/200?u=carlos29', 'https://picsum.photos/seed/cover29/800/300', false, NOW() - interval '34 days', NOW(), 'SEED', 'SEED'),
    ('a0000001-0000-4000-a000-000000000030', 'daisy@demo.com', 'Daisy Miller', 'daisy_m', pwd_hash, 'Garden enthusiast. Flower arranger. Nature photographer.', 'Denver, USA', 'https://i.pravatar.cc/200?u=daisy30', 'https://picsum.photos/seed/cover30/800/300', false, NOW() - interval '32 days', NOW(), 'SEED', 'SEED')
  ;
END $$;

-- ============================================
-- AI BOT USER
-- ============================================
INSERT INTO users (id, email, full_name, username, password, bio, location, profile_picture, cover_photo, is_private, is_bot, created_at, updated_at, created_by, updated_by)
VALUES (
  '00000000-0000-4000-a000-000000000001',
  'ai@pingup.com',
  'PingUp AI',
  'pingup_ai',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'I am PingUp AI assistant. Ask me anything!',
  'Cloud',
  'https://i.pravatar.cc/200?u=pingup_ai',
  'https://picsum.photos/seed/cover_ai/800/300',
  false,
  true,
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CREATE 50 POSTS (UNIQUE IMAGES, MORE VIDEOS)
-- ============================================
INSERT INTO posts (id, user_id, content, image_urls, post_type, likes_count, shares_count, comments_count, location, video_url, created_at, updated_at, created_by, updated_by)
VALUES
  -- Text posts
  ('b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001', 'Just had the best coffee ever! Starting my morning right.', NULL, 'text', 45, 5, 12, 'New York, USA', NULL, NOW() - interval '29 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000002', 'Working on a new project. Excited to share soon!', NULL, 'text', 32, 3, 8, 'San Francisco, USA', NULL, NOW() - interval '28 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000003', 'Just finished reading an amazing book. Highly recommend!', NULL, 'text', 28, 7, 15, 'London, UK', NULL, NOW() - interval '27 days', NOW(), 'SEED', 'SEED'),

  -- Image posts with UNIQUE images
  ('b0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000001', 'Beautiful sunset today!', 'https://picsum.photos/seed/img001/600/400', 'text_with_image', 89, 12, 20, 'Los Angeles, USA', NULL, NOW() - interval '26 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000004', 'Morning yoga session complete!', 'https://picsum.photos/seed/img002/600/400', 'text_with_image', 76, 8, 18, 'Los Angeles, USA', NULL, NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000005', 'Skydiving adventure!', 'https://picsum.photos/seed/img003/600/400,https://picsum.photos/seed/img004/600/400', 'text_with_image', 156, 25, 35, 'Sydney, Australia', NULL, NOW() - interval '24 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000006', 'New painting finished!', 'https://picsum.photos/seed/img005/600/400', 'image', 98, 15, 22, 'Paris, France', NULL, NOW() - interval '23 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000008', 'Homemade sushi night!', 'https://picsum.photos/seed/img006/600/400,https://picsum.photos/seed/img007/600/400,https://picsum.photos/seed/img008/600/400', 'text_with_image', 134, 20, 28, 'Tokyo, Japan', NULL, NOW() - interval '22 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000007', 'New beat dropping this weekend! Stay tuned.', NULL, 'text', 67, 10, 14, 'Berlin, Germany', NULL, NOW() - interval '21 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000009', 'AI is changing everything. What do you think?', NULL, 'text', 89, 18, 45, 'Moscow, Russia', NULL, NOW() - interval '20 days', NOW(), 'SEED', 'SEED'),

  -- More unique image posts
  ('b0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000010', 'Just watched the best movie of the year!', 'https://picsum.photos/seed/img009/600/400', 'text_with_image', 54, 6, 19, 'Toronto, Canada', NULL, NOW() - interval '19 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000012', 'a0000001-0000-4000-a000-000000000011', 'Comedy night was amazing!', 'https://picsum.photos/seed/img010/600/400', 'text_with_image', 78, 9, 16, 'Chicago, USA', NULL, NOW() - interval '18 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000012', 'Planted 50 trees today!', 'https://picsum.photos/seed/img011/600/400,https://picsum.photos/seed/img012/600/400', 'text_with_image', 245, 45, 38, 'Seattle, USA', NULL, NOW() - interval '17 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000013', 'Game winning shot!', 'https://picsum.photos/seed/img013/600/400', 'image', 189, 30, 42, 'Miami, USA', NULL, NOW() - interval '16 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000015', 'Best tacos in town!', 'https://picsum.photos/seed/img014/600/400', 'text_with_image', 67, 8, 11, 'Mexico City, Mexico', NULL, NOW() - interval '15 days', NOW(), 'SEED', 'SEED'),

  -- Video posts
  ('b0000001-0000-4000-a000-000000000016', 'a0000001-0000-4000-a000-000000000004', 'Quick workout routine', NULL, 'text_with_video', 134, 28, 25, 'Los Angeles, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', NOW() - interval '14 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000017', 'a0000001-0000-4000-a000-000000000007', 'Making beats live!', NULL, 'video', 98, 15, 20, 'Berlin, Germany', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', NOW() - interval '13 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000008', 'Cooking tutorial: Ramen', NULL, 'text_with_video', 167, 35, 30, 'Tokyo, Japan', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', NOW() - interval '12 days', NOW(), 'SEED', 'SEED'),

  -- More posts with unique images
  ('b0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000016', 'Concert review coming soon!', 'https://picsum.photos/seed/img015/600/400', 'text_with_image', 56, 7, 13, 'Nashville, USA', NULL, NOW() - interval '11 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000020', 'a0000001-0000-4000-a000-000000000017', 'Hockey season is here!', 'https://picsum.photos/seed/img016/600/400', 'text_with_image', 87, 12, 19, 'Vancouver, Canada', NULL, NOW() - interval '10 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000018', 'New collection preview!', 'https://picsum.photos/seed/img017/600/400,https://picsum.photos/seed/img018/600/400,https://picsum.photos/seed/img019/600/400,https://picsum.photos/seed/img020/600/400', 'image', 234, 40, 35, 'Milan, Italy', NULL, NOW() - interval '9 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000019', 'Transformation Tuesday!', 'https://picsum.photos/seed/img021/600/400', 'text_with_image', 178, 25, 28, 'Brooklyn, USA', NULL, NOW() - interval '8 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000020', 'Recording session vibes', 'https://picsum.photos/seed/img022/600/400', 'text_with_image', 145, 18, 22, 'Memphis, USA', NULL, NOW() - interval '7 days', NOW(), 'SEED', 'SEED'),

  -- New users posts
  ('b0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000021', 'Martial arts training day!', 'https://picsum.photos/seed/img023/600/400,https://picsum.photos/seed/img024/600/400', 'text_with_image', 145, 20, 25, 'Austin, USA', NULL, NOW() - interval '6 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000022', 'New poem written at sunrise', 'https://picsum.photos/seed/img025/600/400', 'text_with_image', 67, 8, 12, 'Lyon, France', NULL, NOW() - interval '6 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000023', 'Behind the scenes of my show!', 'https://picsum.photos/seed/img026/600/400,https://picsum.photos/seed/img027/600/400', 'text_with_image', 234, 35, 40, 'New Jersey, USA', NULL, NOW() - interval '5 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000024', 'Data visualization project complete!', 'https://picsum.photos/seed/img028/600/400', 'text_with_image', 89, 12, 18, 'Singapore', NULL, NOW() - interval '5 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000025', 'New manga character design!', 'https://picsum.photos/seed/img029/600/400,https://picsum.photos/seed/img030/600/400,https://picsum.photos/seed/img031/600/400', 'image', 312, 50, 45, 'Osaka, Japan', NULL, NOW() - interval '4 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000026', 'Desert safari adventure!', 'https://picsum.photos/seed/img032/600/400,https://picsum.photos/seed/img033/600/400', 'text_with_image', 278, 40, 35, 'Dubai, UAE', NULL, NOW() - interval '4 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000027', 'Perfect golf swing!', 'https://picsum.photos/seed/img034/600/400', 'text_with_image', 98, 15, 20, 'Phoenix, USA', NULL, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),

  -- More video posts
  ('b0000001-0000-4000-a000-000000000031', 'a0000001-0000-4000-a000-000000000019', 'HIIT workout tutorial', NULL, 'text_with_video', 198, 32, 28, 'Brooklyn, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000032', 'a0000001-0000-4000-a000-000000000025', 'Digital art timelapse', NULL, 'video', 267, 45, 38, 'Osaka, Japan', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000033', 'a0000001-0000-4000-a000-000000000029', 'Cooking paella!', NULL, 'text_with_video', 189, 28, 32, 'Barcelona, Spain', 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),

  -- Recent posts with unique images
  ('b0000001-0000-4000-a000-000000000034', 'a0000001-0000-4000-a000-000000000028', 'Peaceful morning in the forest', 'https://picsum.photos/seed/img035/600/400', 'text_with_image', 156, 22, 25, 'Portland, USA', NULL, NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000035', 'a0000001-0000-4000-a000-000000000030', 'Spring garden update!', 'https://picsum.photos/seed/img036/600/400,https://picsum.photos/seed/img037/600/400,https://picsum.photos/seed/img038/600/400', 'text_with_image', 234, 35, 30, 'Denver, USA', NULL, NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000036', 'a0000001-0000-4000-a000-000000000001', 'City lights at night', 'https://picsum.photos/seed/img039/600/400', 'image', 189, 25, 22, 'New York, USA', NULL, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000037', 'a0000001-0000-4000-a000-000000000003', 'Cozy reading corner', 'https://picsum.photos/seed/img040/600/400', 'text_with_image', 78, 10, 15, 'London, UK', NULL, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000038', 'a0000001-0000-4000-a000-000000000005', 'Surfing at Bondi Beach!', 'https://picsum.photos/seed/img041/600/400,https://picsum.photos/seed/img042/600/400', 'text_with_image', 267, 40, 35, 'Sydney, Australia', NULL, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000039', 'a0000001-0000-4000-a000-000000000006', 'Abstract art series', 'https://picsum.photos/seed/img043/600/400,https://picsum.photos/seed/img044/600/400', 'image', 198, 30, 28, 'Paris, France', NULL, NOW() - interval '18 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000040', 'a0000001-0000-4000-a000-000000000009', 'AI conference keynote', 'https://picsum.photos/seed/img045/600/400', 'text_with_image', 312, 50, 45, 'Moscow, Russia', NULL, NOW() - interval '16 hours', NOW(), 'SEED', 'SEED'),

  -- More video posts
  ('b0000001-0000-4000-a000-000000000041', 'a0000001-0000-4000-a000-000000000013', 'Basketball skills tutorial', NULL, 'text_with_video', 234, 38, 32, 'Miami, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', NOW() - interval '14 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000042', 'a0000001-0000-4000-a000-000000000021', 'Kickboxing combo tutorial', NULL, 'video', 178, 25, 22, 'Austin, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', NOW() - interval '12 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000043', 'a0000001-0000-4000-a000-000000000026', 'Dubai skyline timelapse', NULL, 'text_with_video', 289, 45, 38, 'Dubai, UAE', 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', NOW() - interval '10 hours', NOW(), 'SEED', 'SEED'),

  -- Latest posts
  ('b0000001-0000-4000-a000-000000000044', 'a0000001-0000-4000-a000-000000000010', 'Film festival highlights!', 'https://picsum.photos/seed/img046/600/400,https://picsum.photos/seed/img047/600/400', 'text_with_image', 145, 20, 18, 'Toronto, Canada', NULL, NOW() - interval '8 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000045', 'a0000001-0000-4000-a000-000000000014', 'Mystery novel sneak peek', 'https://picsum.photos/seed/img048/600/400', 'text_with_image', 89, 12, 15, 'Boston, USA', NULL, NOW() - interval '6 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000046', 'a0000001-0000-4000-a000-000000000018', 'Fashion week moments', 'https://picsum.photos/seed/img049/600/400,https://picsum.photos/seed/img050/600/400,https://picsum.photos/seed/img051/600/400', 'image', 345, 55, 48, 'Milan, Italy', NULL, NOW() - interval '4 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000047', 'a0000001-0000-4000-a000-000000000020', 'New single dropping tonight!', 'https://picsum.photos/seed/img052/600/400', 'text_with_image', 234, 40, 35, 'Memphis, USA', NULL, NOW() - interval '3 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000048', 'a0000001-0000-4000-a000-000000000024', 'Neural network visualization', 'https://picsum.photos/seed/img053/600/400', 'text_with_image', 156, 22, 20, 'Singapore', NULL, NOW() - interval '2 hours', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000049', 'a0000001-0000-4000-a000-000000000029', 'Tapas night!', 'https://picsum.photos/seed/img054/600/400,https://picsum.photos/seed/img055/600/400', 'text_with_image', 198, 28, 25, 'Barcelona, Spain', NULL, NOW() - interval '1 hour', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000050', 'a0000001-0000-4000-a000-000000000030', 'Sunset in my garden', 'https://picsum.photos/seed/img056/600/400', 'image', 167, 22, 18, 'Denver, USA', NULL, NOW() - interval '30 minutes', NOW(), 'SEED', 'SEED'),

  -- MORE VIDEO POSTS (15 additional videos)
  ('b0000001-0000-4000-a000-000000000051', 'a0000001-0000-4000-a000-000000000006', 'Painting timelapse art', NULL, 'video', 189, 32, 28, 'Paris, France', 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NOW() - interval '25 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000052', 'a0000001-0000-4000-a000-000000000003', 'Book review vlog', NULL, 'text_with_video', 145, 22, 18, 'London, UK', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', NOW() - interval '20 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000053', 'a0000001-0000-4000-a000-000000000012', 'Tree planting documentary', NULL, 'video', 278, 45, 38, 'Seattle, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', NOW() - interval '18 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000054', 'a0000001-0000-4000-a000-000000000016', 'Concert highlights!', NULL, 'text_with_video', 234, 38, 32, 'Nashville, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', NOW() - interval '15 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000055', 'a0000001-0000-4000-a000-000000000017', 'Hockey practice clips', NULL, 'video', 156, 25, 20, 'Vancouver, Canada', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', NOW() - interval '12 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000056', 'a0000001-0000-4000-a000-000000000010', 'Movie trailer reaction', NULL, 'text_with_video', 198, 30, 25, 'Toronto, Canada', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', NOW() - interval '10 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000057', 'a0000001-0000-4000-a000-000000000011', 'Stand-up comedy clip', NULL, 'video', 312, 55, 48, 'Chicago, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', NOW() - interval '8 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000058', 'a0000001-0000-4000-a000-000000000020', 'Live performance preview', NULL, 'text_with_video', 267, 42, 35, 'Memphis, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', NOW() - interval '6 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000059', 'a0000001-0000-4000-a000-000000000023', 'Behind the scenes talk show', NULL, 'video', 189, 28, 22, 'New Jersey, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', NOW() - interval '5 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000060', 'a0000001-0000-4000-a000-000000000027', 'Golf swing analysis', NULL, 'text_with_video', 145, 22, 18, 'Phoenix, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', NOW() - interval '4 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000061', 'a0000001-0000-4000-a000-000000000028', 'Forest walk ASMR', NULL, 'video', 234, 35, 28, 'Portland, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', NOW() - interval '3 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000062', 'a0000001-0000-4000-a000-000000000014', 'Mystery writing tips', NULL, 'text_with_video', 167, 25, 20, 'Boston, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', NOW() - interval '2 minutes', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000063', 'a0000001-0000-4000-a000-000000000022', 'Poetry reading session', NULL, 'video', 123, 18, 15, 'Lyon, France', 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', NOW() - interval '1 minute', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000064', 'a0000001-0000-4000-a000-000000000015', 'Food review Mexico City', NULL, 'text_with_video', 198, 30, 25, 'Mexico City, Mexico', 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NOW() - interval '45 seconds', NOW(), 'SEED', 'SEED'),
  ('b0000001-0000-4000-a000-000000000065', 'a0000001-0000-4000-a000-000000000001', 'NYC city tour vlog', NULL, 'video', 289, 48, 40, 'New York, USA', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', NOW() - interval '30 seconds', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CREATE COMMENTS (70+ comments with replies)
-- ============================================
INSERT INTO comments (id, post_id, user_id, content, parent_id, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('c0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002', 'What coffee brand? I need recommendations!', NULL, 5, NOW() - interval '28 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000002', 'b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000003', 'Nothing beats a good morning coffee!', NULL, 8, NOW() - interval '28 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000003', 'b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001', 'Its Blue Bottle! Highly recommend their blend.', 'c0000001-0000-4000-a000-000000000001', 3, NOW() - interval '28 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000004', 'b0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000005', 'Stunning shot! What camera did you use?', NULL, 12, NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000005', 'b0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000006', 'The colors are amazing!', NULL, 9, NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000006', 'b0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000001', 'Shot on iPhone 15 Pro! No filter needed.', 'c0000001-0000-4000-a000-000000000004', 6, NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000007', 'b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000004', 'This is insane! So brave!', NULL, 15, NOW() - interval '23 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000008', 'b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000009', 'Adding this to my bucket list!', NULL, 11, NOW() - interval '23 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000009', 'b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000010', 'How high was the jump?', NULL, 7, NOW() - interval '23 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000010', 'b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000005', '15,000 feet! Pure adrenaline rush!', 'c0000001-0000-4000-a000-000000000009', 4, NOW() - interval '23 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000011', 'b0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000015', 'Recipe please!!! This looks delicious!', NULL, 18, NOW() - interval '21 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000012', 'b0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000007', 'The presentation is beautiful!', NULL, 14, NOW() - interval '21 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000013', 'b0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000008', 'Recipe video coming this weekend!', 'c0000001-0000-4000-a000-000000000011', 8, NOW() - interval '21 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000014', 'b0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000002', 'AI is definitely the future. Exciting times!', NULL, 22, NOW() - interval '19 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000015', 'b0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000003', 'We need to be careful about ethics though.', NULL, 19, NOW() - interval '19 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000016', 'b0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000012', 'What about environmental impact?', NULL, 15, NOW() - interval '19 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000017', 'b0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000009', 'Great point! Energy consumption is a concern.', 'c0000001-0000-4000-a000-000000000016', 10, NOW() - interval '19 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000018', 'b0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000001', 'This is amazing! Where can I join?', NULL, 25, NOW() - interval '16 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000019', 'b0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000004', 'We need more people like you!', NULL, 20, NOW() - interval '16 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000020', 'b0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000012', 'Check out our local chapter at treeplanting.org!', 'c0000001-0000-4000-a000-000000000018', 12, NOW() - interval '16 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000021', 'b0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000001', 'Your art style is so unique!', NULL, 28, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000022', 'b0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000018', 'Would love to collaborate on a fashion project!', NULL, 22, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000023', 'b0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000001', 'Dubai looks incredible!', NULL, 30, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000024', 'b0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000005', 'Need to add this to my travel list!', NULL, 25, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000025', 'b0000001-0000-4000-a000-000000000033', 'a0000001-0000-4000-a000-000000000008', 'Paella is one of my favorites!', NULL, 18, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000026', 'b0000001-0000-4000-a000-000000000033', 'a0000001-0000-4000-a000-000000000015', 'That looks so authentic!', NULL, 15, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000027', 'b0000001-0000-4000-a000-000000000040', 'a0000001-0000-4000-a000-000000000024', 'Great presentation skills!', NULL, 20, NOW() - interval '12 hours', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000028', 'b0000001-0000-4000-a000-000000000040', 'a0000001-0000-4000-a000-000000000002', 'AI is revolutionizing everything!', NULL, 18, NOW() - interval '12 hours', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000029', 'b0000001-0000-4000-a000-000000000046', 'a0000001-0000-4000-a000-000000000026', 'These designs are stunning!', NULL, 35, NOW() - interval '3 hours', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000030', 'b0000001-0000-4000-a000-000000000046', 'a0000001-0000-4000-a000-000000000006', 'Fashion goals right here!', NULL, 28, NOW() - interval '3 hours', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000031', 'b0000001-0000-4000-a000-000000000050', 'a0000001-0000-4000-a000-000000000028', 'So peaceful! Love your garden!', NULL, 12, NOW() - interval '20 minutes', NOW(), 'SEED', 'SEED'),
  ('c0000001-0000-4000-a000-000000000032', 'b0000001-0000-4000-a000-000000000050', 'a0000001-0000-4000-a000-000000000012', 'Nature is the best therapy!', NULL, 10, NOW() - interval '15 minutes', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. CREATE STORIES (20 stories)
-- ============================================
INSERT INTO stories (id, user_id, content, media_url, media_type, background_color, expires_at, views_count, likes_count, created_at, updated_at, created_by, updated_by)
VALUES
  ('d0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001', 'Good morning everyone!', NULL, 'text', '#FF6B6B', NOW() + interval '20 hours', 45, 12, NOW() - interval '4 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000002', NULL, 'https://picsum.photos/seed/story001/400/700', 'image', NULL, NOW() + interval '18 hours', 67, 18, NOW() - interval '6 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000004', 'Workout complete!', 'https://picsum.photos/seed/story002/400/700', 'image', NULL, NOW() + interval '16 hours', 89, 25, NOW() - interval '8 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000005', 'Adventure awaits!', NULL, 'text', '#4ECDC4', NOW() + interval '14 hours', 34, 10, NOW() - interval '10 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000007', NULL, 'https://picsum.photos/seed/story003/400/700', 'image', NULL, NOW() + interval '12 hours', 56, 15, NOW() - interval '12 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000008', 'Cooking something special!', 'https://picsum.photos/seed/story004/400/700', 'image', NULL, NOW() + interval '10 hours', 78, 22, NOW() - interval '14 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000010', 'Movie night!', NULL, 'text', '#9B59B6', NOW() + interval '8 hours', 45, 13, NOW() - interval '16 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000012', NULL, 'https://picsum.photos/seed/story005/400/700', 'image', NULL, NOW() + interval '6 hours', 98, 30, NOW() - interval '18 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000013', 'Game day!', 'https://picsum.photos/seed/story006/400/700', 'image', NULL, NOW() + interval '4 hours', 112, 35, NOW() - interval '20 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000016', 'Backstage vibes', 'https://picsum.photos/seed/story007/400/700', 'image', NULL, NOW() + interval '2 hours', 67, 20, NOW() - interval '22 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000018', 'Fashion week prep', NULL, 'text', '#E74C3C', NOW() + interval '22 hours', 89, 28, NOW() - interval '2 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000012', 'a0000001-0000-4000-a000-000000000019', NULL, 'https://picsum.photos/seed/story008/400/700', 'image', NULL, NOW() + interval '21 hours', 134, 40, NOW() - interval '3 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000020', 'Studio session', 'https://picsum.photos/seed/story009/400/700', 'image', NULL, NOW() + interval '19 hours', 78, 24, NOW() - interval '5 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000025', 'Drawing manga!', 'https://picsum.photos/seed/story010/400/700', 'image', NULL, NOW() + interval '17 hours', 156, 45, NOW() - interval '7 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000026', 'Dubai sunset', 'https://picsum.photos/seed/story011/400/700', 'image', NULL, NOW() + interval '15 hours', 189, 55, NOW() - interval '9 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000016', 'a0000001-0000-4000-a000-000000000029', 'Kitchen prep!', 'https://picsum.photos/seed/story012/400/700', 'image', NULL, NOW() + interval '13 hours', 98, 28, NOW() - interval '11 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000017', 'a0000001-0000-4000-a000-000000000030', 'Garden therapy', NULL, 'text', '#27AE60', NOW() + interval '11 hours', 67, 18, NOW() - interval '13 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000024', 'Coding session', 'https://picsum.photos/seed/story013/400/700', 'image', NULL, NOW() + interval '9 hours', 89, 25, NOW() - interval '15 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000021', 'Training hard!', 'https://picsum.photos/seed/story014/400/700', 'image', NULL, NOW() + interval '7 hours', 112, 32, NOW() - interval '17 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000020', 'a0000001-0000-4000-a000-000000000022', 'Writing poetry', NULL, 'text', '#3498DB', NOW() + interval '5 hours', 45, 12, NOW() - interval '19 hours', NOW(), 'SEED', 'SEED'),

  -- VIDEO STORIES (10 video stories)
  ('d0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000004', 'Quick workout tip!', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video', NULL, NOW() + interval '23 hours', 234, 65, NOW() - interval '1 hour', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000007', 'Beat making live!', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'video', NULL, NOW() + interval '22 hours', 189, 52, NOW() - interval '2 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000008', 'Recipe sneak peek', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'video', NULL, NOW() + interval '21 hours', 267, 78, NOW() - interval '3 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000013', 'Basketball highlights!', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'video', NULL, NOW() + interval '20 hours', 312, 95, NOW() - interval '4 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000019', 'Transformation progress', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'video', NULL, NOW() + interval '19 hours', 198, 58, NOW() - interval '5 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000021', 'Martial arts combo', 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'video', NULL, NOW() + interval '18 hours', 245, 72, NOW() - interval '6 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000025', 'Art process video', 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'video', NULL, NOW() + interval '17 hours', 289, 85, NOW() - interval '7 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000026', 'Dubai vibes!', 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 'video', NULL, NOW() + interval '16 hours', 345, 102, NOW() - interval '8 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000029', 'Cooking magic!', 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'video', NULL, NOW() + interval '15 hours', 178, 48, NOW() - interval '9 hours', NOW(), 'SEED', 'SEED'),
  ('d0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000001', 'NYC moments', 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'video', NULL, NOW() + interval '14 hours', 267, 78, NOW() - interval '10 hours', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. CREATE MESSAGES (50 messages)
-- ============================================
INSERT INTO messages (id, from_user_id, to_user_id, text, message_type, media_url, seen, seen_at, is_message_request, is_request_accepted, created_at, updated_at, created_by, updated_by)
VALUES
  ('e0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002', 'Hey Bob! How is the project going?', 'text', NULL, true, NOW() - interval '2 days', false, true, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001', 'Going great! Almost done with the MVP.', 'text', NULL, true, NOW() - interval '2 days', false, true, NOW() - interval '3 days' + interval '5 minutes', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002', 'That is awesome! Can I see a demo?', 'text', NULL, true, NOW() - interval '2 days', false, true, NOW() - interval '3 days' + interval '10 minutes', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001', 'Sure! Let me send you some screenshots.', 'text', NULL, true, NOW() - interval '1 day', false, true, NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001', NULL, 'image', 'https://picsum.photos/seed/msg001/400/300', true, NOW() - interval '1 day', false, true, NOW() - interval '2 days' + interval '1 minute', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000019', 'Hey Steve! Love your workout posts!', 'text', NULL, true, NOW() - interval '5 days', false, true, NOW() - interval '6 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000004', 'Thanks Diana! Your yoga content is inspiring!', 'text', NULL, true, NOW() - interval '5 days', false, true, NOW() - interval '6 days' + interval '30 minutes', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000019', 'We should do a collab video sometime!', 'text', NULL, true, NOW() - interval '4 days', false, true, NOW() - interval '5 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000004', 'I am totally in! Lets plan it out.', 'text', NULL, true, NOW() - interval '4 days', false, true, NOW() - interval '5 days' + interval '15 minutes', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000018', 'Love your fashion designs!', 'text', NULL, true, NOW() - interval '3 days', false, true, NOW() - interval '4 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000025', 'Thank you! Your manga art is incredible!', 'text', NULL, true, NOW() - interval '3 days', false, true, NOW() - interval '4 days' + interval '1 hour', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000012', 'a0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000018', NULL, 'image', 'https://picsum.photos/seed/msg002/400/300', true, NOW() - interval '2 days', false, true, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000005', 'Your travel photos are amazing!', 'text', NULL, true, NOW() - interval '2 days', false, true, NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000026', 'Thanks Zara! Dubai looks incredible on your feed!', 'text', NULL, true, NOW() - interval '2 days', false, true, NOW() - interval '3 days' + interval '2 hours', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000008', 'Your ramen recipe was perfect!', 'text', NULL, true, NOW() - interval '1 day', false, true, NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000016', 'a0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000029', 'Glad you liked it! Your paella looks amazing too!', 'text', NULL, false, NULL, false, true, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000017', 'a0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000009', 'Lets discuss the AI project!', 'text', NULL, true, NOW() - interval '12 hours', false, true, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000024', 'Sure! What aspects are you interested in?', 'text', NULL, false, NULL, false, true, NOW() - interval '10 hours', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. CREATE CONNECTIONS (40 connections)
-- ============================================
INSERT INTO connections (id, from_user_id, to_user_id, status, created_at, updated_at, created_by, updated_by)
VALUES
  ('f0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002', 'accepted', NOW() - interval '80 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000003', 'accepted', NOW() - interval '75 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004', 'accepted', NOW() - interval '70 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000009', 'accepted', NOW() - interval '65 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000019', 'accepted', NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000013', 'accepted', NOW() - interval '55 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000016', 'accepted', NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000015', 'accepted', NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000025', 'accepted', NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000005', 'accepted', NOW() - interval '35 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000008', 'accepted', NOW() - interval '30 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000012', 'a0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000009', 'accepted', NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000013', 'accepted', NOW() - interval '20 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000012', 'accepted', NOW() - interval '15 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000030', 'pending', NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000016', 'a0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000003', 'pending', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000017', 'a0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000013', 'pending', NOW() - interval '1 day', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. CREATE FOLLOWERS
-- ============================================
INSERT INTO user_followers (follower_id, following_id)
VALUES
  ('a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002'),
  ('a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004'),
  ('a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000005'),
  ('a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001'),
  ('a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000009'),
  ('a0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000001'),
  ('a0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000019'),
  ('a0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000026'),
  ('a0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000016'),
  ('a0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000029'),
  ('a0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000024'),
  ('a0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000025'),
  ('a0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000018'),
  ('a0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000005'),
  ('a0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000008'),
  ('a0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000012')
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. CREATE POST LIKES
-- ============================================
INSERT INTO post_likes (post_id, user_id)
VALUES
  ('b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002'),
  ('b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000003'),
  ('b0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000005'),
  ('b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000015'),
  ('b0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000005'),
  ('b0000001-0000-4000-a000-000000000040', 'a0000001-0000-4000-a000-000000000024'),
  ('b0000001-0000-4000-a000-000000000046', 'a0000001-0000-4000-a000-000000000026'),
  ('b0000001-0000-4000-a000-000000000050', 'a0000001-0000-4000-a000-000000000028')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. CREATE BOOKMARKS
-- ============================================
INSERT INTO bookmarks (id, user_id, post_id, created_at, updated_at, created_by, updated_by)
VALUES
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000028', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000002', 'b0000001-0000-4000-a000-000000000010', NOW() - interval '15 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000005', 'b0000001-0000-4000-a000-000000000029', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000018', 'b0000001-0000-4000-a000-000000000028', NOW() - interval '4 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000026', 'b0000001-0000-4000-a000-000000000046', NOW() - interval '2 hours', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. CREATE NOTIFICATIONS
-- ============================================
INSERT INTO notifications (id, recipient_id, actor_id, type, post_id, comment_id, is_read, message, created_at, updated_at, created_by, updated_by)
VALUES
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002', 'like', 'b0000001-0000-4000-a000-000000000001', NULL, false, 'Bob Smith liked your post', NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000003', 'comment', 'b0000001-0000-4000-a000-000000000001', 'c0000001-0000-4000-a000-000000000002', false, 'Charlie Brown commented on your post', NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000001', 'like', 'b0000001-0000-4000-a000-000000000028', NULL, false, 'Alice Johnson liked your post', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000026', 'like', 'b0000001-0000-4000-a000-000000000046', NULL, false, 'Zara Khan liked your post', NOW() - interval '2 hours', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000028', 'comment', 'b0000001-0000-4000-a000-000000000050', 'c0000001-0000-4000-a000-000000000031', false, 'Bella Swan commented on your post', NOW() - interval '20 minutes', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. CREATE STORY VIEWS (50+ views)
-- ============================================
INSERT INTO story_views (story_id, user_id)
VALUES
  -- Original story views
  ('d0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002'),
  ('d0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000003'),
  ('d0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004'),
  ('d0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001'),
  ('d0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000009'),
  ('d0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000019'),
  ('d0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000001'),
  ('d0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000018'),
  ('d0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000005'),
  ('d0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000001'),
  -- Video story views
  ('d0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000001'),
  ('d0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000019'),
  ('d0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000005'),
  ('d0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000016'),
  ('d0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000020'),
  ('d0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000029'),
  ('d0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000015'),
  ('d0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000021'),
  ('d0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000005'),
  ('d0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000004'),
  ('d0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000013'),
  ('d0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000018'),
  ('d0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000005'),
  ('d0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000008'),
  ('d0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000002')
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. CREATE STORY LIKES (30+ likes)
-- ============================================
INSERT INTO story_likes (story_id, user_id)
VALUES
  ('d0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002'),
  ('d0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000003'),
  ('d0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001'),
  ('d0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000019'),
  ('d0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000018'),
  ('d0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000005'),
  -- Video story likes
  ('d0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000001'),
  ('d0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000019'),
  ('d0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000016'),
  ('d0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000029'),
  ('d0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000021'),
  ('d0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000004'),
  ('d0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000013'),
  ('d0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000018'),
  ('d0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000005'),
  ('d0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000008'),
  ('d0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000002')
ON CONFLICT DO NOTHING;

-- ============================================
-- 13. CREATE COMMENT LIKES (40+ likes)
-- ============================================
INSERT INTO comment_likes (comment_id, user_id)
VALUES
  ('c0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001'),
  ('c0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000003'),
  ('c0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004'),
  ('c0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001'),
  ('c0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000002'),
  ('c0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000005'),
  ('c0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000001'),
  ('c0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000006'),
  ('c0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000001'),
  ('c0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000005'),
  ('c0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000009'),
  ('c0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000004'),
  ('c0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000008'),
  ('c0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000029'),
  ('c0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000009'),
  ('c0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000024'),
  ('c0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000012'),
  ('c0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000004'),
  ('c0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000025'),
  ('c0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000018'),
  ('c0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000005'),
  ('c0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000026'),
  ('c0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000018'),
  ('c0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000025')
ON CONFLICT DO NOTHING;

-- ============================================
-- 14. ADD MORE POST LIKES (50+ likes total)
-- ============================================
INSERT INTO post_likes (post_id, user_id)
VALUES
  -- Add more likes to existing posts
  ('b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004'),
  ('b0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000005'),
  ('b0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000006'),
  ('b0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000007'),
  ('b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000004'),
  ('b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000009'),
  ('b0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000010'),
  ('b0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000029'),
  ('b0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000007'),
  ('b0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000002'),
  ('b0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000024'),
  ('b0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000004'),
  ('b0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000030'),
  ('b0000001-0000-4000-a000-000000000016', 'a0000001-0000-4000-a000-000000000019'),
  ('b0000001-0000-4000-a000-000000000016', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000017', 'a0000001-0000-4000-a000-000000000016'),
  ('b0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000029'),
  ('b0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000015'),
  ('b0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000026'),
  ('b0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000006'),
  -- Video posts likes
  ('b0000001-0000-4000-a000-000000000031', 'a0000001-0000-4000-a000-000000000004'),
  ('b0000001-0000-4000-a000-000000000031', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000032', 'a0000001-0000-4000-a000-000000000018'),
  ('b0000001-0000-4000-a000-000000000033', 'a0000001-0000-4000-a000-000000000008'),
  ('b0000001-0000-4000-a000-000000000041', 'a0000001-0000-4000-a000-000000000021'),
  ('b0000001-0000-4000-a000-000000000042', 'a0000001-0000-4000-a000-000000000013'),
  ('b0000001-0000-4000-a000-000000000043', 'a0000001-0000-4000-a000-000000000005'),
  -- New video posts likes
  ('b0000001-0000-4000-a000-000000000051', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000051', 'a0000001-0000-4000-a000-000000000018'),
  ('b0000001-0000-4000-a000-000000000052', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000053', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000053', 'a0000001-0000-4000-a000-000000000030'),
  ('b0000001-0000-4000-a000-000000000054', 'a0000001-0000-4000-a000-000000000007'),
  ('b0000001-0000-4000-a000-000000000055', 'a0000001-0000-4000-a000-000000000013'),
  ('b0000001-0000-4000-a000-000000000057', 'a0000001-0000-4000-a000-000000000001'),
  ('b0000001-0000-4000-a000-000000000057', 'a0000001-0000-4000-a000-000000000002'),
  ('b0000001-0000-4000-a000-000000000058', 'a0000001-0000-4000-a000-000000000016'),
  ('b0000001-0000-4000-a000-000000000065', 'a0000001-0000-4000-a000-000000000002'),
  ('b0000001-0000-4000-a000-000000000065', 'a0000001-0000-4000-a000-000000000005')
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. ADD MORE NOTIFICATIONS (20+ total)
-- ============================================
INSERT INTO notifications (id, recipient_id, actor_id, type, post_id, comment_id, is_read, message, created_at, updated_at, created_by, updated_by)
VALUES
  -- Follow notifications
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001', 'follow', NULL, NULL, true, 'Alice Johnson started following you', NOW() - interval '80 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000001', 'follow', NULL, NULL, true, 'Alice Johnson started following you', NOW() - interval '70 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000004', 'follow', NULL, NULL, true, 'Diana Prince started following you', NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
  -- Like notifications for video posts
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000019', 'like', 'b0000001-0000-4000-a000-000000000016', NULL, false, 'Steve Rogers liked your video', NOW() - interval '12 hours', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000016', 'like', 'b0000001-0000-4000-a000-000000000017', NULL, false, 'Penny Lane liked your video', NOW() - interval '10 hours', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000029', 'like', 'b0000001-0000-4000-a000-000000000018', NULL, false, 'Carlos Garcia liked your video', NOW() - interval '8 hours', NOW(), 'SEED', 'SEED'),
  -- Comment notifications
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000004', 'comment', 'b0000001-0000-4000-a000-000000000006', 'c0000001-0000-4000-a000-000000000007', false, 'Diana Prince commented on your post', NOW() - interval '22 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000015', 'comment', 'b0000001-0000-4000-a000-000000000008', 'c0000001-0000-4000-a000-000000000011', false, 'Oscar Martinez commented on your post', NOW() - interval '20 days', NOW(), 'SEED', 'SEED'),
  -- Follow request notifications
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000001', 'follow_request', NULL, NULL, false, 'Alice Johnson wants to connect with you', NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000022', 'follow_request', NULL, NULL, false, 'Victor Hugo wants to connect with you', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  -- New video post likes
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000001', 'like', 'b0000001-0000-4000-a000-000000000051', NULL, false, 'Alice Johnson liked your video', NOW() - interval '20 minutes', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000001', 'like', 'b0000001-0000-4000-a000-000000000057', NULL, false, 'Alice Johnson liked your video', NOW() - interval '5 minutes', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002', 'like', 'b0000001-0000-4000-a000-000000000065', NULL, false, 'Bob Smith liked your video', NOW() - interval '1 minute', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- 16. ADD MORE FOLLOWERS (30+ total)
-- ============================================
INSERT INTO user_followers (follower_id, following_id)
VALUES
  ('a0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000018'),
  ('a0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000020'),
  ('a0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000020'),
  ('a0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000021'),
  ('a0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000003'),
  ('a0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000029'),
  ('a0000001-0000-4000-a000-000000000017', 'a0000001-0000-4000-a000-000000000013'),
  ('a0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000004'),
  ('a0000001-0000-4000-a000-000000000020', 'a0000001-0000-4000-a000-000000000016'),
  ('a0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000019'),
  ('a0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000014'),
  ('a0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000020'),
  ('a0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000002'),
  ('a0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000017')
ON CONFLICT DO NOTHING;

-- ============================================
-- 17. ADD MORE CONNECTIONS (25+ total)
-- ============================================
INSERT INTO connections (id, from_user_id, to_user_id, status, created_at, updated_at, created_by, updated_by)
VALUES
  ('f0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000014', 'accepted', NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000018', 'accepted', NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000020', 'a0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000011', 'accepted', NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000015', 'a0000001-0000-4000-a000-000000000029', 'accepted', NOW() - interval '35 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000017', 'a0000001-0000-4000-a000-000000000013', 'accepted', NOW() - interval '30 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000020', 'a0000001-0000-4000-a000-000000000016', 'accepted', NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000020', 'accepted', NOW() - interval '20 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000030', 'accepted', NOW() - interval '10 days', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000011', 'a0000001-0000-4000-a000-000000000023', 'pending', NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('f0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000001', 'pending', NOW() - interval '12 hours', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 18. ADD MORE MESSAGES (30+ total)
-- ============================================
INSERT INTO messages (id, from_user_id, to_user_id, text, message_type, media_url, seen, seen_at, is_message_request, is_request_accepted, created_at, updated_at, created_by, updated_by)
VALUES
  ('e0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000006', 'a0000001-0000-4000-a000-000000000018', 'Love your fashion designs!', 'text', NULL, true, NOW() - interval '40 days', false, true, NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000020', 'a0000001-0000-4000-a000-000000000018', 'a0000001-0000-4000-a000-000000000006', 'Thank you! Your paintings are incredible!', 'text', NULL, true, NOW() - interval '40 days', false, true, NOW() - interval '45 days' + interval '1 hour', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000013', 'a0000001-0000-4000-a000-000000000021', 'Great workout video!', 'text', NULL, true, NOW() - interval '15 days', false, true, NOW() - interval '18 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000022', 'a0000001-0000-4000-a000-000000000021', 'a0000001-0000-4000-a000-000000000013', 'Thanks! Let me know if you want tips.', 'text', NULL, true, NOW() - interval '15 days', false, true, NOW() - interval '18 days' + interval '30 minutes', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000016', 'a0000001-0000-4000-a000-000000000020', 'Your music is amazing!', 'text', NULL, true, NOW() - interval '20 days', false, true, NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000024', 'a0000001-0000-4000-a000-000000000020', 'a0000001-0000-4000-a000-000000000016', 'Thanks Penny! Love your concert reviews!', 'text', NULL, true, NOW() - interval '20 days', false, true, NOW() - interval '25 days' + interval '2 hours', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000005', 'Your travel photos are inspiring!', 'text', NULL, true, NOW() - interval '6 hours', false, true, NOW() - interval '8 hours', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000001', 'Thank you Alice! Planning my next adventure.', 'text', NULL, false, NULL, false, true, NOW() - interval '5 hours', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000027', 'a0000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000001', NULL, 'image', 'https://picsum.photos/seed/msg003/400/300', false, NULL, false, true, NOW() - interval '4 hours', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000028', 'a0000001-0000-4000-a000-000000000012', 'a0000001-0000-4000-a000-000000000030', 'Great garden tips!', 'text', NULL, true, NOW() - interval '5 days', false, true, NOW() - interval '8 days', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000029', 'a0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000012', 'Thanks! Happy to share more!', 'text', NULL, true, NOW() - interval '5 days', false, true, NOW() - interval '8 days' + interval '1 hour', NOW(), 'SEED', 'SEED'),
  ('e0000001-0000-4000-a000-000000000030', 'a0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000016', 'Should we collab on a track?', 'text', NULL, false, NULL, false, true, NOW() - interval '1 hour', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 19. CREATE GROUP CHATS (5 groups)
-- ============================================
INSERT INTO group_chats (id, name, description, avatar_url, creator_id, member_count, is_active, created_at, updated_at, created_by, updated_by)
VALUES
  ('aa000001-0000-4000-a000-000000000001', 'Fitness Enthusiasts', 'A group for fitness lovers to share tips and motivation!', 'https://picsum.photos/seed/group1/200/200', 'a0000001-0000-4000-a000-000000000004', 5, true, NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
  ('aa000001-0000-4000-a000-000000000002', 'Tech Innovators', 'Discussing the latest in AI, ML, and tech trends', 'https://picsum.photos/seed/group2/200/200', 'a0000001-0000-4000-a000-000000000009', 4, true, NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
  ('aa000001-0000-4000-a000-000000000003', 'Foodies Unite', 'Share recipes, restaurant reviews, and food photos!', 'https://picsum.photos/seed/group3/200/200', 'a0000001-0000-4000-a000-000000000008', 4, true, NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  ('aa000001-0000-4000-a000-000000000004', 'Travel Adventurers', 'For those who love exploring the world', 'https://picsum.photos/seed/group4/200/200', 'a0000001-0000-4000-a000-000000000005', 3, true, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  ('aa000001-0000-4000-a000-000000000005', 'Creative Arts', 'Artists, designers, and creators sharing their work', 'https://picsum.photos/seed/group5/200/200', 'a0000001-0000-4000-a000-000000000006', 4, true, NOW() - interval '35 days', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 20. CREATE GROUP MEMBERS (20+ members)
-- ============================================
INSERT INTO group_members (id, group_chat_id, user_id, role, joined_at, last_read_at, is_muted, created_at, updated_at, created_by, updated_by)
VALUES
  -- Fitness Enthusiasts members
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004', 'admin', NOW() - interval '60 days', NOW() - interval '1 hour', false, NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000019', 'member', NOW() - interval '55 days', NOW() - interval '2 hours', false, NOW() - interval '55 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000021', 'member', NOW() - interval '50 days', NOW() - interval '3 hours', false, NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000013', 'member', NOW() - interval '45 days', NOW() - interval '4 hours', false, NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000001', 'member', NOW() - interval '40 days', NOW() - interval '5 hours', true, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  -- Tech Innovators members
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000009', 'admin', NOW() - interval '50 days', NOW() - interval '30 minutes', false, NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000024', 'admin', NOW() - interval '48 days', NOW() - interval '1 hour', false, NOW() - interval '48 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000002', 'member', NOW() - interval '45 days', NOW() - interval '2 hours', false, NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000003', 'member', NOW() - interval '40 days', NOW() - interval '3 hours', false, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  -- Foodies Unite members
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000008', 'admin', NOW() - interval '45 days', NOW() - interval '20 minutes', false, NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000029', 'member', NOW() - interval '42 days', NOW() - interval '1 hour', false, NOW() - interval '42 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000015', 'member', NOW() - interval '40 days', NOW() - interval '2 hours', false, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000001', 'member', NOW() - interval '35 days', NOW() - interval '4 hours', false, NOW() - interval '35 days', NOW(), 'SEED', 'SEED'),
  -- Travel Adventurers members
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000005', 'admin', NOW() - interval '40 days', NOW() - interval '1 hour', false, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000026', 'member', NOW() - interval '38 days', NOW() - interval '2 hours', false, NOW() - interval '38 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000001', 'member', NOW() - interval '35 days', NOW() - interval '3 hours', false, NOW() - interval '35 days', NOW(), 'SEED', 'SEED'),
  -- Creative Arts members
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000006', 'admin', NOW() - interval '35 days', NOW() - interval '1 hour', false, NOW() - interval '35 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000018', 'member', NOW() - interval '32 days', NOW() - interval '2 hours', false, NOW() - interval '32 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000025', 'member', NOW() - interval '30 days', NOW() - interval '3 hours', false, NOW() - interval '30 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000022', 'member', NOW() - interval '28 days', NOW() - interval '4 hours', false, NOW() - interval '28 days', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- 21. CREATE GROUP MESSAGES (30+ messages)
-- ============================================
INSERT INTO group_messages (id, group_chat_id, sender_id, content, message_type, media_url, created_at, updated_at, created_by, updated_by)
VALUES
  -- Fitness Enthusiasts messages
  ('ab000001-0000-4000-a000-000000000001', 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004', 'Welcome everyone to the Fitness Enthusiasts group!', 'text', NULL, NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000002', 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000019', 'Happy to be here! Lets get fit together!', 'text', NULL, NOW() - interval '55 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000003', 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000021', 'Check out my new workout routine!', 'image', 'https://picsum.photos/seed/gmsg1/400/300', NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000004', 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000013', 'Anyone up for a virtual workout session?', 'text', NULL, NOW() - interval '10 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000005', 'aa000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000004', 'Im in! Lets do it tomorrow morning!', 'text', NULL, NOW() - interval '9 days', NOW(), 'SEED', 'SEED'),
  -- Tech Innovators messages
  ('ab000001-0000-4000-a000-000000000006', 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000009', 'AI is changing everything. What do you all think?', 'text', NULL, NOW() - interval '50 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000007', 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000024', 'Totally agree! Working on some ML models right now.', 'text', NULL, NOW() - interval '48 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000008', 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000002', 'The latest GPT models are insane!', 'text', NULL, NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000009', 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000009', 'Check out this visualization I made', 'image', 'https://picsum.photos/seed/gmsg2/400/300', NOW() - interval '5 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000010', 'aa000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000003', 'Impressive work Ivan!', 'text', NULL, NOW() - interval '4 days', NOW(), 'SEED', 'SEED'),
  -- Foodies Unite messages
  ('ab000001-0000-4000-a000-000000000011', 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000008', 'Just made the best ramen ever!', 'text', NULL, NOW() - interval '45 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000012', 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000029', 'Recipe please!', 'text', NULL, NOW() - interval '44 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000013', 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000008', NULL, 'image', 'https://picsum.photos/seed/gmsg3/400/300', NOW() - interval '43 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000014', 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000015', 'That looks delicious!', 'text', NULL, NOW() - interval '42 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000015', 'aa000001-0000-4000-a000-000000000003', 'a0000001-0000-4000-a000-000000000029', 'My paella from last night', 'image', 'https://picsum.photos/seed/gmsg4/400/300', NOW() - interval '3 days', NOW(), 'SEED', 'SEED'),
  -- Travel Adventurers messages
  ('ab000001-0000-4000-a000-000000000016', 'aa000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000005', 'Planning my next trip to Bali!', 'text', NULL, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000017', 'aa000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000026', 'Count me in! Dubai was amazing!', 'text', NULL, NOW() - interval '38 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000018', 'aa000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000026', NULL, 'image', 'https://picsum.photos/seed/gmsg5/400/300', NOW() - interval '37 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000019', 'aa000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000001', 'NYC is always a good idea too!', 'text', NULL, NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  -- Creative Arts messages
  ('ab000001-0000-4000-a000-000000000020', 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000006', 'New painting finished!', 'image', 'https://picsum.photos/seed/gmsg6/400/300', NOW() - interval '35 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000021', 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000018', 'Beautiful colors Fiona!', 'text', NULL, NOW() - interval '34 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000022', 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000025', 'Check out my latest manga character!', 'image', 'https://picsum.photos/seed/gmsg7/400/300', NOW() - interval '30 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000023', 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000022', 'I love the style! Very unique.', 'text', NULL, NOW() - interval '29 days', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000024', 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000006', 'Collaboration idea: fashion x art!', 'text', NULL, NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  ('ab000001-0000-4000-a000-000000000025', 'aa000001-0000-4000-a000-000000000005', 'a0000001-0000-4000-a000-000000000018', 'Im totally in!', 'text', NULL, NOW() - interval '12 hours', NOW(), 'SEED', 'SEED')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 22. CREATE BLOCKED USERS (3 blocked)
-- ============================================
INSERT INTO blocked_users (id, blocker_id, blocked_id, reason, created_at, updated_at, created_by, updated_by)
VALUES
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000010', 'a0000001-0000-4000-a000-000000000015', 'Spam messages', NOW() - interval '30 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000014', 'a0000001-0000-4000-a000-000000000027', NULL, NOW() - interval '20 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000023', 'a0000001-0000-4000-a000-000000000011', 'Inappropriate content', NOW() - interval '10 days', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- 23. CREATE REPORTS (5 reports)
-- ============================================
INSERT INTO reports (id, reporter_id, report_type, reason, description, status, reported_user_id, reported_post_id, reported_comment_id, created_at, updated_at, created_by, updated_by)
VALUES
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'post', 'spam', 'This post looks like spam', 'pending', NULL, 'b0000001-0000-4000-a000-000000000002', NULL, NOW() - interval '5 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000005', 'comment', 'harassment', 'This comment is harassing', 'reviewed', NULL, NULL, 'c0000001-0000-4000-a000-000000000015', NOW() - interval '10 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000012', 'user', 'scam', 'This user is a scammer', 'resolved', 'a0000001-0000-4000-a000-000000000027', NULL, NULL, NOW() - interval '20 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000018', 'post', 'false_information', 'Spreading misinformation', 'pending', NULL, 'b0000001-0000-4000-a000-000000000010', NULL, NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000025', 'comment', 'hate_speech', 'Hateful comment', 'dismissed', NULL, NULL, 'c0000001-0000-4000-a000-000000000016', NOW() - interval '15 days', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- 24. CREATE CHAT SETTINGS (10 settings)
-- ============================================
INSERT INTO chat_settings (id, user_id, chat_with_user_id, nickname, is_muted, is_blocked, background_color, background_image, message_color, deleted_at, created_at, updated_at, created_by, updated_by)
VALUES
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'a0000001-0000-4000-a000-000000000002', 'Bobby', false, false, '#F0F8FF', NULL, '#333333', NULL, NOW() - interval '80 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000002', 'a0000001-0000-4000-a000-000000000001', 'Alice', false, false, '#FFF0F5', NULL, '#333333', NULL, NOW() - interval '80 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000004', 'a0000001-0000-4000-a000-000000000019', 'Steve', false, false, NULL, 'https://picsum.photos/seed/chatbg1/400/800', NULL, NULL, NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000019', 'a0000001-0000-4000-a000-000000000004', 'Diana', false, false, NULL, NULL, '#4B0082', NULL, NOW() - interval '60 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000008', 'a0000001-0000-4000-a000-000000000029', 'Carlos Chef', true, false, '#FFFACD', NULL, NULL, NULL, NOW() - interval '30 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000025', 'a0000001-0000-4000-a000-000000000018', 'Rachel', false, false, '#E6E6FA', NULL, NULL, NULL, NOW() - interval '40 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000026', 'a0000001-0000-4000-a000-000000000005', 'Ethan', false, false, '#F5F5DC', NULL, NULL, NULL, NOW() - interval '35 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000009', 'a0000001-0000-4000-a000-000000000024', 'Xavier', false, false, '#E0FFFF', NULL, NULL, NULL, NOW() - interval '25 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000012', 'a0000001-0000-4000-a000-000000000030', NULL, false, false, '#F0FFF0', NULL, NULL, NULL, NOW() - interval '15 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000007', 'a0000001-0000-4000-a000-000000000016', 'Penny', false, false, '#FFF5EE', NULL, '#8B4513', NULL, NOW() - interval '50 days', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- 25. ADD MORE BOOKMARKS (15+ total)
-- ============================================
INSERT INTO bookmarks (id, user_id, post_id, created_at, updated_at, created_by, updated_by)
VALUES
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000016', NOW() - interval '12 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000001', 'b0000001-0000-4000-a000-000000000033', NOW() - interval '1 day', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000004', 'b0000001-0000-4000-a000-000000000031', NOW() - interval '2 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000008', 'b0000001-0000-4000-a000-000000000018', NOW() - interval '10 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000009', 'b0000001-0000-4000-a000-000000000040', NOW() - interval '14 hours', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000012', 'b0000001-0000-4000-a000-000000000053', NOW() - interval '15 minutes', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000019', 'b0000001-0000-4000-a000-000000000016', NOW() - interval '13 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000024', 'b0000001-0000-4000-a000-000000000052', NOW() - interval '18 minutes', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000029', 'b0000001-0000-4000-a000-000000000018', NOW() - interval '11 days', NOW(), 'SEED', 'SEED'),
  (gen_random_uuid(), 'a0000001-0000-4000-a000-000000000030', 'b0000001-0000-4000-a000-000000000035', NOW() - interval '1 day', NOW(), 'SEED', 'SEED')
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================
SELECT '=== SEED DATA SUMMARY ===' as info;
SELECT 'Users: ' || COUNT(*) FROM users WHERE created_by = 'SEED';
SELECT 'Posts: ' || COUNT(*) FROM posts WHERE created_by = 'SEED';
SELECT 'Comments: ' || COUNT(*) FROM comments WHERE created_by = 'SEED';
SELECT 'Stories: ' || COUNT(*) FROM stories WHERE created_by = 'SEED';
SELECT 'Messages: ' || COUNT(*) FROM messages WHERE created_by = 'SEED';
SELECT 'Connections: ' || COUNT(*) FROM connections WHERE created_by = 'SEED';
SELECT 'Post Likes: ' || COUNT(*) FROM post_likes;
SELECT 'Comment Likes: ' || COUNT(*) FROM comment_likes;
SELECT 'Story Views: ' || COUNT(*) FROM story_views;
SELECT 'Story Likes: ' || COUNT(*) FROM story_likes;
SELECT 'Followers: ' || COUNT(*) FROM user_followers;
SELECT 'Bookmarks: ' || COUNT(*) FROM bookmarks WHERE created_by = 'SEED';
SELECT 'Notifications: ' || COUNT(*) FROM notifications WHERE created_by = 'SEED';
SELECT 'Group Chats: ' || COUNT(*) FROM group_chats WHERE created_by = 'SEED';
SELECT 'Group Members: ' || COUNT(*) FROM group_members WHERE created_by = 'SEED';
SELECT 'Group Messages: ' || COUNT(*) FROM group_messages WHERE created_by = 'SEED';
SELECT 'Blocked Users: ' || COUNT(*) FROM blocked_users WHERE created_by = 'SEED';
SELECT 'Reports: ' || COUNT(*) FROM reports WHERE created_by = 'SEED';
SELECT 'Chat Settings: ' || COUNT(*) FROM chat_settings WHERE created_by = 'SEED';
SELECT '=== SEEDING COMPLETED ===' as info;
