-- Seed Data for Marketplace Feature
-- Requires: users table already populated (from seed-data.sql)
-- Creates: products, seller_reviews

-- ============================================
-- CREATE ENUMS IF NOT EXIST
-- ============================================
DO $$ BEGIN CREATE TYPE "public"."products_status_enum" AS ENUM ('active', 'sold', 'reserved', 'deleted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."products_condition_enum" AS ENUM ('new', 'like_new', 'good', 'fair', 'poor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."products_category_enum" AS ENUM ('electronics', 'vehicles', 'fashion', 'home', 'sports', 'books', 'toys', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."marketplace_orders_status_enum" AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- CREATE TABLES IF NOT EXIST
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(200) NOT NULL,
  description text,
  price decimal(15,0) NOT NULL,
  currency varchar(10) NOT NULL DEFAULT 'VND',
  category "public"."products_category_enum" NOT NULL DEFAULT 'other',
  condition "public"."products_condition_enum" NOT NULL DEFAULT 'good',
  status "public"."products_status_enum" NOT NULL DEFAULT 'active',
  image_urls text,
  location varchar(255),
  location_lat decimal(10,8),
  location_lng decimal(11,8),
  views_count int NOT NULL DEFAULT 0,
  saves_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by varchar DEFAULT 'SYSTEM',
  updated_by varchar DEFAULT 'SYSTEM',
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS product_saves (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating int NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by varchar DEFAULT 'SYSTEM',
  updated_by varchar DEFAULT 'SYSTEM',
  deleted_at timestamptz,
  UNIQUE(reviewer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_code varchar NOT NULL UNIQUE,
  amount bigint NOT NULL,
  status "public"."marketplace_orders_status_enum" NOT NULL DEFAULT 'pending',
  vnpay_transaction_no varchar,
  vnpay_response_code varchar,
  vnpay_data jsonb,
  shipping_address text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by varchar DEFAULT 'SYSTEM',
  updated_by varchar DEFAULT 'SYSTEM',
  deleted_at timestamptz
);

-- ============================================
-- CLEAN EXISTING MARKETPLACE DATA
-- ============================================
TRUNCATE TABLE marketplace_orders, product_saves, seller_reviews, products CASCADE;

-- ============================================
-- SEED PRODUCTS (40 products from various users)
-- Using random users from seed-data.sql
-- ============================================

-- Helper: get user IDs by username
-- We'll use subqueries to reference existing users

-- ELECTRONICS
INSERT INTO products (user_id, title, description, price, category, condition, status, image_urls, location, views_count, saves_count, created_at) VALUES
((SELECT id FROM users WHERE username = 'sarah_dev' LIMIT 1), 'MacBook Pro M3 14" 2024', 'MacBook Pro M3 chip, 16GB RAM, 512GB SSD. Used for 3 months, like new condition with original box and charger.', 32000000, 'electronics', 'like_new', 'active', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800,https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800', 'Ho Chi Minh City', 234, 18, NOW() - INTERVAL '2 days'),

((SELECT id FROM users WHERE username = 'mike_photo' LIMIT 1), 'iPhone 15 Pro Max 256GB', 'iPhone 15 Pro Max Natural Titanium, 256GB. Perfect condition, full box with AppleCare+ until 2025.', 28500000, 'electronics', 'like_new', 'active', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800,https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', 'Ha Noi', 456, 32, NOW() - INTERVAL '1 day'),

((SELECT id FROM users WHERE username = 'alex_music' LIMIT 1), 'Sony WH-1000XM5 Headphones', 'Sony flagship noise-cancelling headphones. Black color, excellent sound quality. Used 6 months.', 5500000, 'electronics', 'good', 'active', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800,https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800', 'Da Nang', 89, 7, NOW() - INTERVAL '3 days'),

((SELECT id FROM users WHERE username = 'jenny_art' LIMIT 1), 'iPad Air M2 2024 + Apple Pencil', 'iPad Air M2 64GB WiFi, Space Gray. Comes with Apple Pencil Pro and Smart Folio case. Perfect for drawing!', 18000000, 'electronics', 'new', 'active', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800,https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800', 'Ho Chi Minh City', 167, 14, NOW() - INTERVAL '5 hours'),

((SELECT id FROM users WHERE username = 'david_code' LIMIT 1), 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24 Ultra 256GB Titanium Black. Mint condition, comes with all accessories.', 24000000, 'electronics', 'like_new', 'active', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', 'Ha Noi', 312, 22, NOW() - INTERVAL '4 days'),

((SELECT id FROM users WHERE username = 'lisa_yoga' LIMIT 1), 'AirPods Pro 2nd Gen', 'Apple AirPods Pro with USB-C. Brand new sealed in box. Won in a lucky draw but already have one.', 4500000, 'electronics', 'new', 'active', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800', 'Ho Chi Minh City', 78, 5, NOW() - INTERVAL '6 hours'),

((SELECT id FROM users WHERE username = 'tom_travel' LIMIT 1), 'Nintendo Switch OLED + Games', 'Nintendo Switch OLED White model with 5 games: Zelda TOTK, Mario Kart 8, Animal Crossing, Pokemon Scarlet, Splatoon 3.', 7500000, 'electronics', 'good', 'active', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800,https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800', 'Da Nang', 145, 11, NOW() - INTERVAL '1 day'),

-- FASHION
((SELECT id FROM users WHERE username = 'emma_style' LIMIT 1), 'Nike Air Jordan 1 Retro High OG', 'Size 42 (US 8.5). Brand new, deadstock. Chicago colorway. With original receipt.', 4200000, 'fashion', 'new', 'active', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800,https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800', 'Ho Chi Minh City', 523, 45, NOW() - INTERVAL '12 hours'),

((SELECT id FROM users WHERE username = 'nina_dance' LIMIT 1), 'Gucci GG Marmont Bag', 'Authentic Gucci GG Marmont mini bag, dusty pink. Used twice, comes with box, dustbag, and receipt.', 35000000, 'fashion', 'like_new', 'active', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800,https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', 'Ha Noi', 289, 28, NOW() - INTERVAL '2 days'),

((SELECT id FROM users WHERE username = 'sarah_dev' LIMIT 1), 'Vintage Levi 501 Jeans', 'Original Levi 501 from the 90s. Size 30. Great vintage wash, no tears or stains.', 1200000, 'fashion', 'good', 'active', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', 'Ho Chi Minh City', 67, 4, NOW() - INTERVAL '3 days'),

((SELECT id FROM users WHERE username = 'emma_style' LIMIT 1), 'Ray-Ban Aviator Classic', 'Ray-Ban Aviator RB3025 Gold/Green. Original with case and certificate. Worn a few times.', 2800000, 'fashion', 'like_new', 'active', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', 'Ho Chi Minh City', 134, 9, NOW() - INTERVAL '1 day'),

-- VEHICLES
((SELECT id FROM users WHERE username = 'tom_travel' LIMIT 1), 'Honda SH 150i 2023', 'Honda SH 150i ABS, matte black. 5000km only. Full service history at Honda dealer. No accidents.', 95000000, 'vehicles', 'like_new', 'active', 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=800,https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800', 'Ho Chi Minh City', 876, 52, NOW() - INTERVAL '6 hours'),

((SELECT id FROM users WHERE username = 'david_code' LIMIT 1), 'Yamaha XSR 155 2023', 'Yamaha XSR 155 retro cafe racer style. 8000km, well maintained. Custom exhaust and mirrors.', 55000000, 'vehicles', 'good', 'active', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800', 'Ha Noi', 432, 31, NOW() - INTERVAL '4 days'),

((SELECT id FROM users WHERE username = 'mike_photo' LIMIT 1), 'Xiaomi Electric Scooter Pro 2', 'Xiaomi Mi Electric Scooter Pro 2. Max speed 25km/h, range 45km. Perfect for city commute.', 8500000, 'vehicles', 'good', 'active', 'https://images.unsplash.com/photo-1604868189950-5c06d0a5e71e?w=800', 'Da Nang', 198, 15, NOW() - INTERVAL '2 days'),

-- HOME & GARDEN
((SELECT id FROM users WHERE username = 'lisa_yoga' LIMIT 1), 'IKEA MALM Desk + Chair', 'IKEA MALM desk (140x65cm) white with MARKUS office chair. Both in excellent condition. Moving sale!', 3500000, 'home', 'good', 'active', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', 'Ho Chi Minh City', 234, 19, NOW() - INTERVAL '8 hours'),

((SELECT id FROM users WHERE username = 'jenny_art' LIMIT 1), 'Dyson V15 Detect Vacuum', 'Dyson V15 Detect cordless vacuum. Used 6 months, all attachments included. Laser dust detection is amazing!', 12000000, 'home', 'good', 'active', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800', 'Ha Noi', 156, 12, NOW() - INTERVAL '3 days'),

((SELECT id FROM users WHERE username = 'alex_music' LIMIT 1), 'Philips Air Fryer XXL', 'Philips Premium Airfryer XXL HD9650. Twin TurboStar technology. Makes crispy food with 90% less fat.', 3200000, 'home', 'like_new', 'active', 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=800', 'Ho Chi Minh City', 89, 6, NOW() - INTERVAL '1 day'),

((SELECT id FROM users WHERE username = 'nina_dance' LIMIT 1), 'Set of 4 Indoor Plants + Pots', 'Beautiful set of indoor plants: Monstera, Snake Plant, Peace Lily, Pothos. All with ceramic pots.', 800000, 'home', 'good', 'active', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800,https://images.unsplash.com/photo-1463320726281-696a485928c7?w=800', 'Da Nang', 67, 3, NOW() - INTERVAL '5 days'),

-- SPORTS
((SELECT id FROM users WHERE username = 'tom_travel' LIMIT 1), 'Giant Contend AR 2 Road Bike', 'Giant Contend AR 2 2023 size M/L. Shimano Claris groupset. Perfect first road bike. 2000km ridden.', 15000000, 'sports', 'good', 'active', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800,https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800', 'Ho Chi Minh City', 345, 27, NOW() - INTERVAL '2 days'),

((SELECT id FROM users WHERE username = 'lisa_yoga' LIMIT 1), 'Manduka PRO Yoga Mat + Accessories', 'Manduka PRO 6mm yoga mat (Black Magic) + 2 blocks + strap + towel. Premium quality, barely used.', 2500000, 'sports', 'like_new', 'active', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800', 'Ho Chi Minh City', 78, 5, NOW() - INTERVAL '1 day'),

((SELECT id FROM users WHERE username = 'mike_photo' LIMIT 1), 'Decathlon 20kg Dumbbell Set', 'Adjustable dumbbell set 2x 10kg. Chrome plated, with carry case. Perfect for home workouts.', 1500000, 'sports', 'good', 'active', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'Ha Noi', 112, 8, NOW() - INTERVAL '4 days'),

-- BOOKS
((SELECT id FROM users WHERE username = 'sarah_dev' LIMIT 1), 'Programming Books Bundle (10 books)', 'Clean Code, Design Patterns, DDIA, System Design Interview, Cracking the Coding Interview, and 5 more. All in great condition.', 1800000, 'books', 'good', 'active', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800,https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800', 'Ho Chi Minh City', 267, 21, NOW() - INTERVAL '6 hours'),

((SELECT id FROM users WHERE username = 'jenny_art' LIMIT 1), 'Art & Design Book Collection', 'Collection of 8 art books: Steal Like an Artist, Color and Light, Figure Drawing for All Its Worth, etc.', 1200000, 'books', 'good', 'active', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800', 'Ha Noi', 89, 6, NOW() - INTERVAL '2 days'),

((SELECT id FROM users WHERE username = 'david_code' LIMIT 1), 'Manga Collection - One Piece Vol 1-50', 'One Piece manga volumes 1-50 in Vietnamese. Some wear but all readable. Great for collectors!', 2000000, 'books', 'fair', 'active', 'https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=800', 'Ha Noi', 178, 14, NOW() - INTERVAL '3 days'),

-- TOYS
((SELECT id FROM users WHERE username = 'nina_dance' LIMIT 1), 'LEGO Technic Porsche 911 GT3 RS', 'LEGO Technic 42056 Porsche 911 GT3 RS. Brand new sealed. Discontinued set, great for collectors!', 8500000, 'toys', 'new', 'active', 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=800,https://images.unsplash.com/photo-1472457897821-70d241e9a56e?w=800', 'Ho Chi Minh City', 345, 29, NOW() - INTERVAL '1 day'),

((SELECT id FROM users WHERE username = 'emma_style' LIMIT 1), 'DJI Mini 3 Pro Drone', 'DJI Mini 3 Pro with Fly More Combo. Under 249g, 4K/60fps video. Perfect for travel photography.', 16000000, 'toys', 'like_new', 'active', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800,https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800', 'Da Nang', 234, 18, NOW() - INTERVAL '3 days'),

-- OTHER
((SELECT id FROM users WHERE username = 'alex_music' LIMIT 1), 'Fender Stratocaster MIM 2022', 'Fender Player Stratocaster Made in Mexico. Sunburst finish, maple neck. Comes with gig bag and strap.', 18000000, 'other', 'good', 'active', 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800,https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800', 'Ho Chi Minh City', 198, 15, NOW() - INTERVAL '2 days'),

((SELECT id FROM users WHERE username = 'alex_music' LIMIT 1), 'Roland FP-30X Digital Piano', 'Roland FP-30X with stand and pedal. Weighted 88 keys, great touch. Perfect for learning and practice.', 15000000, 'other', 'good', 'active', 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800', 'Ha Noi', 134, 10, NOW() - INTERVAL '5 days'),

((SELECT id FROM users WHERE username = 'tom_travel' LIMIT 1), 'Camping Set - Tent + Sleeping Bags', '4-person tent (Naturehike) + 2 sleeping bags + camping stove + lantern. Used 3 times. Great condition.', 3500000, 'other', 'good', 'active', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800,https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800', 'Da Nang', 156, 12, NOW() - INTERVAL '1 day'),

-- SOLD items
((SELECT id FROM users WHERE username = 'sarah_dev' LIMIT 1), 'Dell XPS 15 2023', 'Dell XPS 15 9530, i7-13700H, 32GB RAM, 1TB SSD. Sold to a happy buyer!', 28000000, 'electronics', 'like_new', 'sold', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800', 'Ho Chi Minh City', 567, 34, NOW() - INTERVAL '7 days'),

((SELECT id FROM users WHERE username = 'emma_style' LIMIT 1), 'Adidas Yeezy Boost 350 V2', 'Size 42. Zebra colorway. Sold!', 5500000, 'fashion', 'new', 'sold', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800', 'Ho Chi Minh City', 789, 56, NOW() - INTERVAL '10 days');

-- ============================================
-- SEED SELLER REVIEWS
-- ============================================
INSERT INTO seller_reviews (reviewer_id, seller_id, rating, comment, created_at) VALUES
((SELECT id FROM users WHERE username = 'mike_photo' LIMIT 1), (SELECT id FROM users WHERE username = 'sarah_dev' LIMIT 1), 5, 'Great seller! MacBook was exactly as described. Fast shipping and excellent packaging.', NOW() - INTERVAL '5 days'),
((SELECT id FROM users WHERE username = 'jenny_art' LIMIT 1), (SELECT id FROM users WHERE username = 'sarah_dev' LIMIT 1), 4, 'Good condition product. Slightly delayed response but overall great experience.', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'david_code' LIMIT 1), (SELECT id FROM users WHERE username = 'emma_style' LIMIT 1), 5, 'Authentic product, super fast delivery! Will buy from again.', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE username = 'lisa_yoga' LIMIT 1), (SELECT id FROM users WHERE username = 'emma_style' LIMIT 1), 5, 'Amazing seller! Very responsive and honest about product condition.', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'sarah_dev' LIMIT 1), (SELECT id FROM users WHERE username = 'tom_travel' LIMIT 1), 4, 'Nice bike! Minor scratches that were not mentioned but overall fair price.', NOW() - INTERVAL '6 days'),
((SELECT id FROM users WHERE username = 'emma_style' LIMIT 1), (SELECT id FROM users WHERE username = 'alex_music' LIMIT 1), 5, 'Guitar was in perfect condition. Great communication throughout!', NOW() - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'tom_travel' LIMIT 1), (SELECT id FROM users WHERE username = 'mike_photo' LIMIT 1), 4, 'Good product, fair price. Would recommend this seller.', NOW() - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'alex_music' LIMIT 1), (SELECT id FROM users WHERE username = 'nina_dance' LIMIT 1), 5, 'LEGO set was brand new sealed as promised. Very trustworthy seller!', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'nina_dance' LIMIT 1), (SELECT id FROM users WHERE username = 'lisa_yoga' LIMIT 1), 4, 'Yoga mat quality is great. Quick meetup for the exchange.', NOW() - INTERVAL '4 days'),
((SELECT id FROM users WHERE username = 'mike_photo' LIMIT 1), (SELECT id FROM users WHERE username = 'jenny_art' LIMIT 1), 5, 'Art books were in excellent condition. Careful packaging too!', NOW() - INTERVAL '1 day');

-- ============================================
-- SEED PRODUCT SAVES (some users saved products)
-- ============================================
INSERT INTO product_saves (product_id, user_id)
SELECT p.id, u.id FROM products p, users u
WHERE p.title LIKE '%MacBook%' AND u.username = 'david_code'
ON CONFLICT DO NOTHING;

INSERT INTO product_saves (product_id, user_id)
SELECT p.id, u.id FROM products p, users u
WHERE p.title LIKE '%iPhone%' AND u.username = 'sarah_dev'
ON CONFLICT DO NOTHING;

INSERT INTO product_saves (product_id, user_id)
SELECT p.id, u.id FROM products p, users u
WHERE p.title LIKE '%Jordan%' AND u.username = 'tom_travel'
ON CONFLICT DO NOTHING;

INSERT INTO product_saves (product_id, user_id)
SELECT p.id, u.id FROM products p, users u
WHERE p.title LIKE '%Honda SH%' AND u.username = 'mike_photo'
ON CONFLICT DO NOTHING;

INSERT INTO product_saves (product_id, user_id)
SELECT p.id, u.id FROM products p, users u
WHERE p.title LIKE '%LEGO%' AND u.username = 'lisa_yoga'
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Marketplace seed complete!' AS status;
SELECT COUNT(*) AS total_products FROM products;
SELECT COUNT(*) AS total_reviews FROM seller_reviews;
