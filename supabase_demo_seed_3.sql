-- =====================================================================
-- LEVELUP — 4 More Demo Classrooms (Different Languages)
--
-- Adds classrooms in HTML, CSS, Java, and TypeScript under
-- teacher@levelup.demo, so classroom cards show a real mix of language
-- icons/colors instead of everything being Python.
--
-- Uses E'...' escape-string syntax throughout (NOT plain '...') so \n
-- is correctly interpreted as a real newline — see supabase_fix_newlines.sql
-- for why this matters.
--
-- Safe to re-run: skips a classroom if its room_code already exists.
-- =====================================================================

DO $$
DECLARE
  v_teacher_id UUID;
  v_alex_id UUID;
  v_priya_id UUID;
  v_jordan_id UUID;
  v_classroom_id UUID;
  v_problem_id UUID;
BEGIN
  SELECT id INTO v_teacher_id FROM profiles WHERE email = 'teacher@levelup.demo';
  SELECT id INTO v_alex_id    FROM profiles WHERE email = 'alex@levelup.demo';
  SELECT id INTO v_priya_id   FROM profiles WHERE email = 'priya@levelup.demo';
  SELECT id INTO v_jordan_id  FROM profiles WHERE email = 'jordan@levelup.demo';

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'teacher@levelup.demo not found — sign up demo accounts first.';
  END IF;

  -- ===================================================================
  -- Classroom 4: HTML Foundations
  -- ===================================================================
  IF NOT EXISTS (SELECT 1 FROM classrooms WHERE room_code = 'DEMO04') THEN
    INSERT INTO classrooms (class_name, teacher_id, room_code)
    VALUES ('HTML Foundations', v_teacher_id, 'DEMO04')
    RETURNING id INTO v_classroom_id;

    INSERT INTO enrollments (student_id, classroom_id) VALUES
      (v_alex_id, v_classroom_id),
      (v_jordan_id, v_classroom_id);

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Build a Semantic Page Layout',
      'Structure a simple page using semantic HTML5 tags: header, nav, main, article, and footer — no divs for these roles.',
      'exercise', 'html',
      E'<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <!-- your code here -->\n\n</body>\n</html>',
      'N/A', 'A page with header, nav, main, and footer elements'
    ) RETURNING id INTO v_problem_id;

    INSERT INTO submissions (student_id, problem_id, code, output, status, feedback) VALUES
      (v_alex_id, v_problem_id,
       E'<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <header><h1>Welcome</h1></header>\n  <nav><a href="#">Home</a></nav>\n  <main><article>Content goes here</article></main>\n  <footer>© 2026</footer>\n</body>\n</html>',
       'Valid semantic HTML', 'correct', 'Good structure — nav and footer used correctly.');

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Accessible Forms',
      'Build a signup form with properly associated <label> elements and appropriate input types.',
      'assignment', 'html',
      E'<form>\n  <!-- your code here -->\n\n</form>',
      'N/A', 'Form with labeled email and password fields'
    );
  END IF;

  -- ===================================================================
  -- Classroom 5: CSS Layout & Styling
  -- ===================================================================
  IF NOT EXISTS (SELECT 1 FROM classrooms WHERE room_code = 'DEMO05') THEN
    INSERT INTO classrooms (class_name, teacher_id, room_code)
    VALUES ('CSS Layout & Styling', v_teacher_id, 'DEMO05')
    RETURNING id INTO v_classroom_id;

    INSERT INTO enrollments (student_id, classroom_id) VALUES
      (v_priya_id, v_classroom_id),
      (v_jordan_id, v_classroom_id);

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Center a Div (Flexbox)',
      'Center a single div both horizontally and vertically within its parent using Flexbox.',
      'exercise', 'css',
      E'.parent {\n  height: 300px;\n  /* your code here */\n}\n\n.child {\n  width: 100px;\n  height: 100px;\n  background: coral;\n}',
      'N/A', 'display: flex; justify-content: center; align-items: center;'
    ) RETURNING id INTO v_problem_id;

    INSERT INTO submissions (student_id, problem_id, code, output, status, feedback) VALUES
      (v_priya_id, v_problem_id,
       E'.parent {\n  height: 300px;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n.child {\n  width: 100px;\n  height: 100px;\n  background: coral;\n}',
       'Centered correctly', 'correct', 'Clean, minimal flexbox solution.'),
      (v_jordan_id, v_problem_id,
       E'.parent {\n  height: 300px;\n  text-align: center;\n}\n\n.child {\n  width: 100px;\n  height: 100px;\n  background: coral;\n  margin: 0 auto;\n}',
       'Horizontally centered only', 'incorrect', 'This centers horizontally but not vertically — try Flexbox or Grid for both axes at once.');

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Responsive Grid Gallery',
      'Build a responsive image gallery using CSS Grid that reflows from 4 columns to 1 as the viewport narrows.',
      'assignment', 'css',
      E'.gallery {\n  /* your code here */\n}',
      'N/A', 'CSS Grid with responsive column count'
    );
  END IF;

  -- ===================================================================
  -- Classroom 6: Java Programming Basics
  -- ===================================================================
  IF NOT EXISTS (SELECT 1 FROM classrooms WHERE room_code = 'DEMO06') THEN
    INSERT INTO classrooms (class_name, teacher_id, room_code)
    VALUES ('Java Programming Basics', v_teacher_id, 'DEMO06')
    RETURNING id INTO v_classroom_id;

    INSERT INTO enrollments (student_id, classroom_id) VALUES
      (v_alex_id, v_classroom_id),
      (v_priya_id, v_classroom_id);

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Sum of an Array',
      'Write a method that returns the sum of all integers in an array.',
      'exercise', 'java',
      E'public class Main {\n    public static int sumArray(int[] nums) {\n        // your code here\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5};\n        System.out.println(sumArray(nums));\n    }\n}',
      '{1,2,3,4,5}', '15'
    ) RETURNING id INTO v_problem_id;

    INSERT INTO submissions (student_id, problem_id, code, output, status, feedback) VALUES
      (v_alex_id, v_problem_id,
       E'public class Main {\n    public static int sumArray(int[] nums) {\n        int total = 0;\n        for (int n : nums) {\n            total += n;\n        }\n        return total;\n    }\n\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5};\n        System.out.println(sumArray(nums));\n    }\n}',
       '15', 'correct', 'Clean enhanced for-loop, well done.');

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Palindrome Checker',
      'Write a method that checks whether a given String reads the same forwards and backwards.',
      'assignment', 'java',
      E'public class Main {\n    public static boolean isPalindrome(String s) {\n        // your code here\n        return false;\n    }\n}',
      '"racecar"', 'true'
    );
  END IF;

  -- ===================================================================
  -- Classroom 7: TypeScript Essentials
  -- ===================================================================
  IF NOT EXISTS (SELECT 1 FROM classrooms WHERE room_code = 'DEMO07') THEN
    INSERT INTO classrooms (class_name, teacher_id, room_code)
    VALUES ('TypeScript Essentials', v_teacher_id, 'DEMO07')
    RETURNING id INTO v_classroom_id;

    INSERT INTO enrollments (student_id, classroom_id) VALUES
      (v_priya_id, v_classroom_id),
      (v_alex_id, v_classroom_id);

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Typed Interfaces',
      'Define a User interface with id, name, and an optional email field, then write a function that formats a greeting from it.',
      'exercise', 'typescript',
      E'interface User {\n  // your code here\n}\n\nfunction greet(user: User): string {\n  // your code here\n  return "";\n}',
      '{id: 1, name: "Alex"}', '"Hello, Alex!"'
    ) RETURNING id INTO v_problem_id;

    INSERT INTO submissions (student_id, problem_id, code, output, status, feedback) VALUES
      (v_priya_id, v_problem_id,
       E'interface User {\n  id: number;\n  name: string;\n  email?: string;\n}\n\nfunction greet(user: User): string {\n  return `Hello, ${user.name}!`;\n}',
       'Hello, Alex!', 'correct', 'Correct use of the optional modifier on email.');

    INSERT INTO problems (classroom_id, title, description, type, language, starter_code, sample_input, expected_output)
    VALUES (
      v_classroom_id, 'Generic Stack',
      'Implement a simple generic Stack<T> class with push, pop, and peek methods.',
      'assignment', 'typescript',
      E'class Stack<T> {\n  // your code here\n}',
      'N/A', 'A working generic stack implementation'
    );
  END IF;

  RAISE NOTICE 'Added 4 more classrooms: HTML (DEMO04), CSS (DEMO05), Java (DEMO06), TypeScript (DEMO07).';
END $$;
