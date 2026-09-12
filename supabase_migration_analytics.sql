-- Migration: assignment analytics + due-soon digest notifications
-- Run this once in the Supabase SQL Editor, after supabase_migration_duedate.sql.

-- 1. Track each hint request so teachers can see which assignment students
--    get stuck on most ("most-requested-hint assignment" analytic).
CREATE TABLE IF NOT EXISTS hint_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hint_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can log own hint requests." ON hint_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own hint requests." ON hint_requests
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view hint requests in their classrooms." ON hint_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM classrooms c WHERE c.id = classroom_id AND c.teacher_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_hint_requests_problem ON hint_requests(problem_id);
CREATE INDEX IF NOT EXISTS idx_hint_requests_classroom ON hint_requests(classroom_id);

-- 2. Allow a new 'due_soon' notification type (digest for assignments due
--    within the next 24 hours).
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'follow', 'submission', 'feedback', 'due_soon'));

-- 3. SECURITY DEFINER function a student's client calls once per session
--    (e.g. on dashboard load) to generate "due soon" notifications for
--    themselves. Idempotent: never creates a duplicate for the same
--    problem, so calling it repeatedly across logins is safe.
CREATE OR REPLACE FUNCTION check_due_soon_notifications(p_student_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  -- Only let a user generate notifications for themselves.
  IF auth.uid() IS DISTINCT FROM p_student_id THEN
    RETURN;
  END IF;

  SELECT name INTO v_actor_name FROM profiles WHERE id = p_student_id;

  INSERT INTO notifications (user_id, actor_id, actor_name, type, content, resource_id)
  SELECT
    p_student_id,
    p_student_id,
    COALESCE(v_actor_name, 'You'),
    'due_soon',
    p.title,
    p.id
  FROM problems p
  JOIN enrollments e ON e.classroom_id = p.classroom_id
  WHERE e.student_id = p_student_id
    AND p.due_date IS NOT NULL
    AND p.due_date > NOW()
    AND p.due_date <= NOW() + INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = p_student_id AND n.type = 'due_soon' AND n.resource_id = p.id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION check_due_soon_notifications(UUID) TO authenticated;
