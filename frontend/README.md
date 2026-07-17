# EduCloud Lite Frontend

React 19, TypeScript, React Router, and Vite UI for EduCloud Lite.

## Configuration and run

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8001/api
```

Open `http://localhost:5173`. The backend must be running on port `8001`.

## Implemented UI flows

- Supabase-backed register/login through FastAPI JWT authentication.
- Role-aware navigation and protected student, instructor, and admin routes.
- Live published catalog, header search, and course detail.
- Instructor course settings, curriculum, file uploads, and status management.
- Student enrollment and responsive Learning Page with video, playlist, materials, previous/next navigation, and persisted completion.
- Live My Learning and Admin dashboards; neither uses demo metric arrays.

The access token and user summary are stored in `sessionStorage` under `educloud-auth-session`. Sign out clears the session. If an old pre-JWT session causes a problem, clear session storage and sign in again.

## UI smoke test

1. Instructor: publish a course and add lessons.
2. Student: enroll, complete one lesson, refresh, and confirm progress persists.
3. Admin: compare dashboard metrics/recent users with Supabase Table Editor.
4. Run `npm run build` to validate TypeScript and the production bundle.

## Known limitations

- Password-reset email is intentionally shown as unavailable until an email provider and reset-token flow are configured.
- Course completion is tracked, but downloadable certificates are not issued.
- Admin can view live platform data but cannot yet edit roles, suspend users, or review courses from the UI.
