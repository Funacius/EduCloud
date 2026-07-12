# EduCloud Lite Test Cases

| Test Case ID | Feature | Input | Expected Result | Status |
| --- | --- | --- | --- | --- |
| TC-001 | Register user successfully | Valid user JSON | User is registered | Not Started |
| TC-002 | Login successfully | Correct email and password | Token is returned | Not Started |
| TC-003 | Login with wrong password | Correct email, wrong password | Error response is returned | Not Started |
| TC-004 | Get course list | GET `/api/courses` | Course list is returned | Not Started |
| TC-005 | Create course | Valid course JSON | Course is created | Not Started |
| TC-006 | Create lesson | Valid lesson JSON | Lesson is created | Not Started |
| TC-007 | Enroll course | Course ID | Enrollment is created | Not Started |
| TC-008 | Complete lesson | Lesson ID | Lesson is marked complete | Not Started |
| TC-009 | Get progress | Course ID | Progress percentage is returned | Not Started |
| TC-010 | Upload file | Sample file | File URL is returned | Not Started |
| TC-011 | Check CloudWatch logs | API request activity | Logs show request and errors | Not Started |
