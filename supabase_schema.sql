
-- 1. Create Profiles table (tied to Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('teacher', 'student')),
  photo_url TEXT,
  bio TEXT,
  learning_path TEXT DEFAULT 'Software Engineer',
  learning_path_subtitle TEXT DEFAULT 'Mastering Web Development & Databases',
  location TEXT DEFAULT 'Global Remote',
  location_subtitle TEXT DEFAULT 'Learning across borders',
  class_status TEXT DEFAULT 'Active Member',
  class_status_subtitle TEXT DEFAULT 'Engaging in collaborative classrooms',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Classrooms table
CREATE TABLE classrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Problems table (Missions)
CREATE TABLE problems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('exercise', 'assignment')),
  language TEXT NOT NULL,
  instructions_url TEXT,
  starter_code TEXT,
  sample_input TEXT,
  expected_output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  output TEXT,
  status TEXT CHECK (status IN ('pending', 'correct', 'incorrect')) DEFAULT 'pending',
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Live Sessions table (Real-time code sync)
CREATE TABLE live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  code TEXT,
  language TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

-- 6. Resources table
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enrollments table (Many-to-many relationship)
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, classroom_id)
);

-- Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- ... rest of policies ...

-- Enrollments Policies
CREATE POLICY "Users can view own enrollments." ON enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view enrollments for their classes." ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);
CREATE POLICY "Students can enroll themselves via room code (handled by RPC or simple insert)." ON enrollments FOR INSERT WITH CHECK (student_id = auth.uid());

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Classrooms Policies
CREATE POLICY "Classrooms are viewable by everyone." ON classrooms FOR SELECT USING (true);
CREATE POLICY "Teachers can create classrooms." ON classrooms FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own classrooms." ON classrooms FOR UPDATE USING (teacher_id = auth.uid());

-- Problems Policies
CREATE POLICY "Problems are viewable by participants." ON problems FOR SELECT USING (true);
CREATE POLICY "Teachers can manage problems." ON problems FOR ALL USING (
  EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);

-- Submissions Policies
CREATE POLICY "Students can view own submissions." ON submissions FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view all submissions for their classrooms." ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM problems p
    JOIN classrooms c ON p.classroom_id = c.id
    WHERE p.id = problem_id AND c.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can submit." ON submissions FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers can update submissions (feedback)." ON submissions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM problems p
    JOIN classrooms c ON p.classroom_id = c.id
    WHERE p.id = problem_id AND c.teacher_id = auth.uid()
  )
);

-- Live Sessions Policies
CREATE POLICY "Users can view relevant live sessions." ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Students can update own live session." ON live_sessions FOR ALL USING (student_id = auth.uid());

-- Resources Policies
CREATE POLICY "Resources are viewable by everyone." ON resources FOR SELECT USING (true);
CREATE POLICY "Teachers can manage resources." ON resources FOR ALL USING (
  EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE classrooms;
ALTER PUBLICATION supabase_realtime ADD TABLE problems;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE resources;

-- 11. STORAGE BUCKET SETUP
-- Note: Create a bucket named 'materials' in the Supabase Storage Dashboard.
-- Set the bucket to 'Public' or add suitable RLS policies for public read:
-- 1. policy: "Allow public read"
--    - definition: (bucket_id = 'materials'::text)
--    - allow for: SELECT
-- 2. policy: "Allow authenticated upload"
--    - definition: (bucket_id = 'materials'::text) AND (auth.role() = 'authenticated'::text)
--    - allow for: INSERT, UPDATE, DELETE
