# EduCloud Lite Frontend

React 19, TypeScript, React Router, and Vite UI for EduCloud Lite.

## Latest frontend update

Compared with the last pushed baseline (`4db8c0a`), the UI now provides:

- Email confirmation/resend and a two-screen password recovery flow: enter the email code first, then choose the new password.
- Student/Instructor signup choice and an Instructor application/review flow without granting Instructor access before Admin approval.
- A Student Profile page for certificate information and issued-certificate history.
- Resume learning at the first incomplete lesson and unlock a final assessment only after all lessons are complete.
- Instructor assessment editing for questions, options, correct answers, pass score, attempt count, publication state, and time limit.
- A timed Student assessment page with pass/fail results and certificate issuance feedback.
- A dedicated responsive and printable EduCloud certificate page without displaying its internal UUID.
- Live Instructor enrollment/completion figures, Admin Instructor-request review, course visibility oversight, and the `/admin/health` dashboard.
- Role-aware navigation and protected routes for Student, Instructor, and Admin features.

S3 is not required for these flows. Uploads still use local backend storage, while certificates use the browser's Print/Save-as-PDF feature until server-side PDF/S3 delivery is added.

## Configuration and run

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8001/api
VITE_COGNITO_REGION=YOUR_AWS_REGION
VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID
VITE_ALLOW_LEGACY_AUTH=true
```

Open `http://localhost:5173`. The backend must be running on port `8001`.

The Cognito values identify the developer's own User Pool and public app client. They must match the backend configuration. Never put `DATABASE_URL`, a Supabase password, `JWT_SECRET_KEY`, or AWS access keys in a `VITE_*` variable because frontend variables are included in the browser bundle.

## Implemented UI flows

- Cognito signup, email confirmation/resend, login, and forgot/reset password using the existing custom UI.
- Cognito-to-FastAPI token exchange, with Supabase remaining the application-role authority.
- Role-aware navigation and protected student, instructor, and admin routes.
- Live published catalog, header search, and course detail.
- Instructor course settings, curriculum, file uploads, and status management.
- Instructor final-assessment editor with multiple-choice questions, correct answers, pass mark, attempt count, publication state, and time limit.
- Student enrollment and responsive Learning Page with video, playlist, materials, previous/next navigation, and persisted completion.
- Student timed final-assessment page; passing is required before certificate issuance.
- Student profile plus a dedicated branded certificate page that supports Print / Save as PDF.
- Instructor course enrollment and completion metrics.
- Student/Instructor choice on signup; Instructor selection continues directly to the application form and admin review queue.
- Admin course visibility moderation and a dedicated Health Monitoring page.
- Live My Learning and Admin dashboards; neither uses demo metric arrays.

The access token and user summary are stored in `sessionStorage` under `educloud-auth-session`. Sign out clears the session. If an old pre-JWT session causes a problem, clear session storage and sign in again.

## UI smoke test

1. Student: register, enter the six-digit Cognito email code, sign in, and verify `users.cognito_sub` in Supabase.
2. Instructor: create a draft, add lessons, configure/publish the final assessment, then publish the course.
3. Student: enroll, complete every lesson, pass the timed test, then verify the certificate result and printable certificate.
4. Confirm exactly one matching `certificates` row and one passed `assessment_attempts` row exist.
5. Student: submit **Become an instructor** from Profile.
6. Admin: approve/reject the pending application; rejection requires a note.
7. After approval, sign out and sign in again as that user and verify Instructor navigation appears.
8. Admin: moderate course visibility and open `/admin/health`.
9. Run `npm run build` to validate TypeScript and the production bundle.

## Known limitations

- Seeded local accounts use the development-only legacy fallback until equivalent Cognito accounts with the same emails are created.
- Certificates can be printed/saved to PDF; automatic server-side PDF/S3 storage awaits AWS integration.
- Admin can review instructors and course visibility, but cannot yet suspend/delete users.
