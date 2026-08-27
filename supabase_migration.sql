-- =====================================================================
-- LEVELUP — Security Patch Migration
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe to run multiple times (idempotent).
-- =====================================================================

-- 1. POSTS: remove the open "any user can update any post" policy
DROP POLICY IF EXISTS "Users can also update like counts on any post." ON posts;

-- 2. Safe RPC functions for like counts (SECURITY DEFINER, likes_count only)
CREATE OR REPLACE FUNCTION increment_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_likes(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_post_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes(UUID) TO authenticated;

-- 3. LIVE_SESSIONS: scope reads to the owning student or their teacher only
DROP POLICY IF EXISTS "Users can view relevant live sessions." ON live_sessions;

CREATE POLICY "Users can view own or their classroom's live sessions." ON live_sessions FOR SELECT USING (
  student_id = auth.uid()
  OR classroom_id IN (
    SELECT id FROM classrooms WHERE teacher_id = auth.uid()
  )
);

-- 4. NOTIFICATIONS: remove open insert policy, scope to real relationships
DROP POLICY IF EXISTS "Users can create notifications for others." ON notifications;

CREATE POLICY "Teachers/students can notify within their own classroom." ON notifications FOR INSERT WITH CHECK (
  auth.uid() = actor_id
  AND (
    EXISTS (
      SELECT 1 FROM classrooms c
      JOIN enrollments e ON e.classroom_id = c.id
      WHERE c.teacher_id = auth.uid() AND e.student_id = user_id
    )
    OR EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classrooms c ON c.id = e.classroom_id
      WHERE e.student_id = auth.uid() AND c.teacher_id = user_id
    )
  )
);

-- 5. Auto-notification triggers (likes, comments, follows) — server-side,
--    can't be forged by the client
CREATE OR REPLACE FUNCTION notify_on_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_author_id UUID;
  v_actor_name TEXT;
  v_actor_avatar TEXT;
BEGIN
  SELECT author_id INTO v_author_id FROM posts WHERE id = NEW.post_id;
  IF v_author_id IS NULL OR v_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  SELECT name, photo_url INTO v_actor_name, v_actor_avatar FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type, resource_id)
  VALUES (v_author_id, NEW.user_id, COALESCE(v_actor_name, 'Anonymous'), v_actor_avatar, 'like', NEW.post_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_post_like ON post_likes;
CREATE TRIGGER trg_notify_on_post_like
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION notify_on_post_like();

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_author_id UUID;
  v_actor_avatar TEXT;
BEGIN
  SELECT author_id INTO v_author_id FROM posts WHERE id = NEW.post_id;
  IF v_author_id IS NULL OR v_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;
  SELECT photo_url INTO v_actor_avatar FROM profiles WHERE id = NEW.author_id;
  INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type, content, resource_id)
  VALUES (
    v_author_id, NEW.author_id, NEW.author_name, v_actor_avatar, 'comment',
    CASE WHEN length(NEW.content) > 30 THEN substring(NEW.content from 1 for 27) || '...' ELSE NEW.content END,
    NEW.post_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON comments;
CREATE TRIGGER trg_notify_on_comment
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_avatar TEXT;
BEGIN
  SELECT name, photo_url INTO v_actor_name, v_actor_avatar FROM profiles WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, actor_id, actor_name, actor_avatar, type)
  VALUES (NEW.following_id, NEW.follower_id, COALESCE(v_actor_name, 'Anonymous'), v_actor_avatar, 'follow');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_follow ON follows;
CREATE TRIGGER trg_notify_on_follow
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- =====================================================================
-- Done. Verify with:
--   SELECT policyname FROM pg_policies WHERE tablename IN
--     ('posts','live_sessions','notifications');
--   SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trg_notify_%';
-- =====================================================================
