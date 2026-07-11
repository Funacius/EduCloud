## 1. Phạm vi

Các endpoint:

```text
GET    /api/courses
GET    /api/courses/{courseId}
POST   /api/courses
PUT    /api/courses/{courseId}
DELETE /api/courses/{courseId}

GET    /api/courses/{courseId}/lessons
POST   /api/courses/{courseId}/lessons
PUT    /api/lessons/{lessonId}
DELETE /api/lessons/{lessonId}
```

Các file thuộc phạm vi trực tiếp:

- `backend/app/routes/course_routes.py`
- `backend/app/routes/lesson_routes.py`
- Phần Course/Lesson trong `api/api-contract.md`
- Phần Course/Lesson trong `api/openapi.yaml`
- Tài liệu này


## 2. Frontend hiện tại cần gì

Frontend đã dùng public route ID dạng string:

```text
/courses/course-1
/learn/course-1
```

Frontend khai báo envelope chung:

```ts
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};
```

Course list/card dùng:

```ts
type Course = {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  thumbnailUrl?: string;
  level?: number | string;
  category?: string;
  tags?: string[];
  duration?: string;
};
```

Course detail hiện render thêm:

```ts
type CourseDetail = Course & {
  videoCount: string;
  whatYouWillLearn: string[];
  lessons: string[];
  requirements: string[];
};
```

`lessons` trong Course detail chỉ là danh sách tiêu đề vì
`CourseDetailPage` chỉ render tên bài. Full nội dung bài học thuộc Learning
API:

```ts
type Lesson = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  materialUrl?: string;
  order: number;
};
```

## 3. Chuyển đổi FE–BE

Quy ước:

| Layer | ID | Tên field |
| --- | --- | --- |
| Database/SQLAlchemy | integer | `snake_case` |
| Python service | integer | `snake_case` |
| Pydantic field nội bộ | integer hoặc domain value | `snake_case` |
| HTTP JSON/TypeScript | public string | `camelCase` |

Mapping:

| Frontend/API JSON | Backend/service |
| --- | --- |
| `course-1` | `course_id = 1` |
| `lesson-5` | `lesson_id = 5` |
| `instructorName` | `instructor_name` |
| `thumbnailUrl` | `thumbnail_url` |
| `courseId` | `course_id` |
| `videoUrl` | `video_url` |
| `materialUrl` | `material_url` |
| `whatYouWillLearn` | `what_you_will_learn` |
| `videoCount` | `video_count` |
| `order` | `order_index` |

`order_index` là tên đang có ở backend branch được đối chiếu. Backend có thể
đổi tên nội bộ nếu cần, nhưng public JSON luôn giữ `order`.

Pydantic v2 xử lý đổi key bằng alias:

- `alias_generator` đổi snake_case sang camelCase.
- `populate_by_name=True` cho phép schema nhận dữ liệu snake_case từ service.
- `response_model_by_alias=True` buộc response JSON dùng alias.
- `order_index` cần alias riêng là `order`.

Alias chỉ đổi tên key, không đổi giá trị. Integer `1` thành `"course-1"` hoặc
`"lesson-1"` cần public-ID parser/serializer riêng.

Luồng đầy đủ:

```text
Frontend gửi camelCase + "course-1"
→ route/schema validate
→ route parse "course-1" thành 1
→ route model_dump(by_alias=False) thành snake_case
→ service query/commit bằng integer + snake_case
→ response schema nhận ORM/domain object
→ serializer đổi integer ID thành public ID
→ alias đổi field thành camelCase
→ frontend nhận ApiResponse<T>
```

Route không viết mapper thủ công cho từng response và không sửa trực tiếp ORM
object chỉ để đổi format JSON.

## 4. Public ID và internal ID

Database tiếp tục dùng integer:

```text
courses.id = 1
lessons.id = 5
lessons.course_id = 1
```

Public API dùng:

```text
course-1
lesson-5
```

Ví dụ:

```text
GET /api/courses/course-1
→ parse_public_id("course-1", "course")
→ service.get_public_course_detail(course_id=1)
→ response id "course-1"
```

Public ID hợp lệ phải đúng prefix và phần số là integer dương. Các giá trị sau
không hợp lệ:

```text
abc
course-0
course--1
lesson-1 tại Course endpoint
course-1 tại Lesson endpoint
```

Lỗi trả HTTP `400`:

```json
{
  "success": false,
  "message": "Invalid course ID",
  "error": "INVALID_PUBLIC_ID"
}
```


## 5. Response

Mọi endpoint Course/Lesson dùng:

```json
{
  "success": true,
  "message": "Courses loaded",
  "data": []
}
```

Lỗi domain:

```json
{
  "success": false,
  "message": "Course not found",
  "error": "COURSE_NOT_FOUND"
}
```

### Course list

`GET /api/courses` trả trực tiếp `data: Course[]`. Không thêm `items`, `page`,
`total` hoặc `totalPages` vì frontend khai báo `ApiResponse<Course[]>`.

Query `q` là optional, tìm kiếm không phân biệt hoa thường trên title và
description. Chuỗi không có kết quả trả `data: []`, không phải `404`.

Public list chỉ chứa course `published`, không chứa `draft` hoặc `archived`.

### Course detail

Public detail chỉ trả course `published`. Course không tồn tại, draft hoặc
archived đều trả `404 COURSE_NOT_FOUND`; public API không tiết lộ trạng thái
nội bộ.

Các field dẫn xuất:

- `instructorName`: lấy từ quan hệ Course → User, không lấy từ request body.
- `duration`: số active lesson, format `"{n} lessons"`.
- `videoCount`: số active lesson có `video_url`, format
  `"{n} video lessons"`.
- `lessons`: title của active lessons, sort theo `order_index ASC`, rồi `id ASC`.

`whatYouWillLearn` và `requirements` là mảng string thuộc dữ liệu Course.
Backend dev quyết định cách lưu/migration nhưng service phải trả được chúng.

### Lesson list

`GET /api/courses/{courseId}/lessons` trả full `Lesson[]`. Chỉ active lessons
của public course được trả, sort theo `order_index ASC`, rồi `id ASC`.

`content` trả string; nếu database cho phép null thì service/schema chuẩn hóa
thành chuỗi rỗng để đúng frontend type.

## 6. Actor và quyền

| Actor | Đọc Course | Đọc Lesson | Mutation Course | Mutation Lesson |
| --- | --- | --- | --- | --- |
| Anonymous | Có | Có trong MVP | Không | Không |
| Student | Có | Có trong MVP | Không | Không |
| Instructor | Có | Có | Chỉ course của mình | Chỉ lesson thuộc course của mình |
| Admin | Có | Có | Mọi course | Mọi lesson |

Lesson đang public cho cả người chưa đăng nhập và student chưa enroll. Đây là
quyết định MVP vì nút Start Course hiện đi thẳng tới `/learn/:courseId`, trong
khi frontend chưa gửi Bearer token/check enrollment cho flow này.

Khi auth/enrollment hoàn thiện có thể đổi authorization thành:

```text
enrolled student OR course owner instructor OR admin → xem full lesson
người khác → xem summary hoặc yêu cầu đăng nhập
```

Việc thắt quyền sau này không cần đổi public `Lesson` DTO; chỉ thay dependency
và service authorization.

Mutation luôn cần Bearer token. Route kiểm tra role instructor/admin qua
dependency của người 2; service kiểm tra ownership bằng actor từ token. Không
nhận `instructorId`, `userId` hoặc role từ request body.

## 7. Course lifecycle

```text
Create → published → archived
```

- Course mới mặc định `published` vì frontend chưa có draft/publish workflow.
- Status là field nội bộ, không nằm trong public `Course` type.
- Instructor chỉ mutation course của mình; admin bypass ownership.
- Client không được update `id`, `instructorId`, `instructorName`, `status`,
  `duration` hoặc `videoCount`.
- Update chỉ thay các field xuất hiện trong payload.
- Empty update trả `400 VALIDATION_ERROR`.
- `DELETE` nghĩa là soft archive: đổi status sang `archived`.
- Archive không xóa row, lessons, enrollment hoặc progress history.
- Kết quả archive là `{ "id": "course-1", "archived": true }`.

Management endpoint để instructor xem course archived của mình hoặc admin xem
toàn bộ trạng thái chưa có trong frontend và không nằm trong MVP endpoint list
hiện tại. Soft archive giữ dữ liệu để có thể bổ sung flow đó sau.

## 8. Lesson lifecycle và thứ tự

```text
Create → active/published → archived
```

- Create/update/archive Lesson yêu cầu owner của parent Course hoặc admin.
- `order >= 1`.
- Hai active lessons trong cùng course không được trùng order.
- Cùng một order ở hai course khác nhau được phép.
- Khi update, lesson hiện tại không tự xung đột với chính nó.
- Duplicate order trả `409 LESSON_ORDER_CONFLICT`.
- Archive Lesson không xóa progress history.
- Archived Lesson biến mất khỏi Course detail và Learning list.
- Khi Course archived, toàn bộ Lesson bên trong không còn public dù Lesson chưa
  cần đổi status.
- Kết quả archive là `{ "id": "lesson-5", "archived": true }`.

## 9. Create/update payload

### Course

Client được gửi:

```json
{
  "title": "Cloud Fundamentals",
  "description": "Learn the basic concepts of cloud computing.",
  "thumbnailUrl": "https://example.com/course.jpg",
  "level": "Beginner",
  "category": "Foundations",
  "tags": ["Cloud", "AWS"],
  "whatYouWillLearn": ["Understand cloud computing"],
  "requirements": ["Basic web development knowledge"]
}
```

Create yêu cầu `title`, `description`. Update là partial nhưng phải có ít nhất
một field hợp lệ.

### Lesson

Client được gửi:

```json
{
  "title": "Introduction to AWS",
  "content": "Lesson content",
  "videoUrl": "https://example.com/video.mp4",
  "materialUrl": "https://example.com/material.pdf",
  "order": 1
}
```

Create yêu cầu `title`, `order`; `content` mặc định chuỗi rỗng. Update là
partial nhưng phải có ít nhất một field hợp lệ.

## 10. Service interface mà routes đang chờ

Routes người 4 cố ý gọi service bằng internal integer ID và snake_case payload:

```python
course_service.list_public_courses(db, query: str | None)
course_service.get_public_course_detail(db, course_id: int)
course_service.create_course(db, payload: dict, actor: CurrentUser)
course_service.update_course(db, course_id: int, payload: dict, actor: CurrentUser)
course_service.archive_course(db, course_id: int, actor: CurrentUser)

lesson_service.list_public_course_lessons(db, course_id: int)
lesson_service.create_lesson(db, course_id: int, payload: dict, actor: CurrentUser)
lesson_service.update_lesson(db, lesson_id: int, payload: dict, actor: CurrentUser)
lesson_service.archive_lesson(db, lesson_id: int, actor: CurrentUser)
```

Service chịu trách nhiệm:

- Query/join và cung cấp đủ dữ liệu response.
- Lọc status và search.
- Kiểm tra not found, ownership và duplicate order.
- Gán instructor từ actor, default status và timestamps.
- Transaction, commit/rollback và soft archive.
- Trả ORM/domain object hoặc dict snake_case phù hợp response schema.

Route chịu trách nhiệm:

- Parse public ID.
- Validate request qua Pydantic.
- Chuyển payload thành snake_case bằng `model_dump(by_alias=False)`.
- Áp role dependency cho mutation.
- Chọn response model và response envelope.

Response schema/public-ID helper chịu trách nhiệm:

- Nhận ORM/dict snake_case.
- Alias thành camelCase.
- Format integer ID thành public string ID.
- Alias riêng `order_index → order`.

## 11. Dependency từ các thành viên khác

### Người 2 — auth/core

Routes đang chờ:

```python
CurrentUser
require_roles("instructor", "admin")
```

Người 2 cung cấp JWT decode, 401 response, current user ID/role và global error
handler. Không dùng placeholder luôn trả user 1/student.

### Backend business logic developer

Cần cung cấp model/migration/schema/service đáp ứng mục 10. Các field backend
branch hiện có chưa đủ cho frontend gồm instructor name, level, category, tags,
learning outcomes, requirements, derived counts và archive Lesson.

### Người 5

Enrollment/progress/upload và Postman nằm ngoài phần này. Enrollment guard chưa
áp dụng cho Lesson read trong MVP. Sau khi OpenAPI được khóa, người 5 cập nhật
Postman theo camelCase/public ID contract.

## 12. Các conflict đã được người 4 quyết định

| Backend branch hiện tại | Contract cuối |
| --- | --- |
| Public path nhận integer | Nhận `course-1`, `lesson-1` |
| JSON trả snake_case | JSON trả camelCase |
| `order_index` ra frontend | JSON field là `order` |
| Course detail trả `Lesson[]` | Course detail trả lesson title `string[]` |
| Course create mặc định draft | MVP mặc định published |
| DELETE gọi `db.delete` | DELETE soft archive |
| List trả mọi status | Public list chỉ published |
| Lesson read không lọc archive | Chỉ trả active lesson của public course |
| Chưa kiểm tra duplicate order | Trả 409 khi trùng active order |
| Lỗi FastAPI dạng `detail` | Standard `{ success, message, error }` |
| Auth placeholder | Dùng JWT/current user của người 2 |
| Thiếu field frontend | Backend service/model phải cung cấp |

Người 4 xử lý khác biệt về public ID, JSON naming, response shape và HTTP
contract ở API boundary. Người 4 không tự tạo dữ liệu còn thiếu, không viết SQL
trong route và không chuyển business logic của service lên route.

## 13. Error contract

| Trường hợp | HTTP | Error code |
| --- | ---: | --- |
| Public ID sai format/prefix | 400 | `INVALID_PUBLIC_ID` |
| Empty update payload | 400 | `VALIDATION_ERROR` |
| Chưa đăng nhập khi mutation | 401 | `AUTHENTICATION_REQUIRED` |
| Role sai/không sở hữu Course | 403 | `COURSE_FORBIDDEN` |
| Role sai/không sở hữu Lesson | 403 | `LESSON_FORBIDDEN` |
| Course không public/tồn tại | 404 | `COURSE_NOT_FOUND` |
| Lesson không public/tồn tại | 404 | `LESSON_NOT_FOUND` |
| Duplicate active lesson order | 409 | `LESSON_ORDER_CONFLICT` |
| Body không đúng schema | 422 | `VALIDATION_ERROR` |

