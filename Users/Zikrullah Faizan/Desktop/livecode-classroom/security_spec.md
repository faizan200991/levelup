# Security Specification

## Data Invariants
1. **Users**: A user can only read and write their own profile document. The `uid` in the document must match the authenticated `uid`.
2. **Classes**: 
    - Teachers can create classes.
    - Teachers own the classes they create.
    - Students can read classes they are members of (in the `studentIds` array).
3. **Problems**:
    - Belong to a class.
    - Only the teacher who owns the class can create/update/delete problems.
    - Students in the class can read problems.
4. **Submissions**:
    - Students can create submissions for problems in classes they belong to.
    - Students can only read their own submissions.
    - Teachers can read all submissions for classes they own.
5. **LiveCode**:
    - Students write their own live code snapshots.
    - Teachers can read live code for students in their classes.
6. **Resources**:
    - Only teachers can upload/manage resources.
    - Students in the class can read resources.

## The "Dirty Dozen" Payloads (Deny Cases)

1. **Identity Theft (Users)**: Auth UID `A` attempts to write to `users/B`.
2. **Role Escalation (Users)**: Student UID `A` attempts to change their `role` to `teacher`.
3. **Orphaned Class**: Auth UID `A` attempts to create a class with `teacherId` of `B`.
4. **Illegal Problem Access**: Student UID `A` (member) attempts to delete a problem.
5. **Cross-Class Submission**: Student UID `A` (in Class 1) attempts to submit a problem for Class 2.
6. **Submission Spoofing**: Student UID `A` attempts to submit with `studentId` of `B`.
7. **Feedback Hijacking**: Student UID `A` (owner of submission) attempts to update the `feedback` field (System/Teacher-only).
8. **LiveCode Eavesdropping**: Student UID `A` attempts to read `liveCode/B` (another student).
9. **Unverified Write**: User with `email_verified: false` attempts to create a class.
10. **ID Poisoning**: Attempting to create a class with a document ID that is 2KB long.
11. **Resource Deletion**: Student attempts to delete a teacher's resource.
12. **Status Shortcutting**: Student attempts to set submission status to `correct` directly.
