CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION users_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_search_vector_trigger ON users;

CREATE TRIGGER users_search_vector_trigger
  BEFORE INSERT OR UPDATE OF username, full_name, email, location
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION users_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_users_search_vector
ON users USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_users_username_trgm
ON users USING GIN(username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm
ON users USING GIN(full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_email_trgm
ON users USING GIN(email gin_trgm_ops);

UPDATE users
SET search_vector =
  setweight(to_tsvector('simple', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(full_name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(email, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(location, '')), 'C')
WHERE search_vector IS NULL;

-- Posts search vector
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('vietnamese', COALESCE(NEW.content, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_search_vector_trigger ON posts;

CREATE TRIGGER posts_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION posts_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_posts_search_vector
ON posts USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_posts_content_trgm
ON posts USING GIN(content gin_trgm_ops);

-- Update existing posts search_vector
UPDATE posts
SET search_vector = setweight(to_tsvector('vietnamese', COALESCE(content, '')), 'A')
WHERE search_vector IS NULL;
