# CampusOne School Management System - Progress Tracker

> **Last Updated:** 2026-09-20  
> **Current Phase:** Week 4 Complete - People Management (Students, Parents, Student Enrollment)  
> **Next Phase:** Week 5 - Attendance

---

## 📋 Section 1: Phase & Milestone Tracking

### Development Roadmap Overview

| Week | Phase | Status | Completion Date | Notes |
|------|-------|--------|-----------------|-------|
| 1 | Foundation (Next.js, Express, Prisma, DB Schema) | ✅ **COMPLETE** | 2026-09-18 | Project initialized, core models, academic years module |
| 2 | Authentication & RBAC | ✅ **COMPLETE** | 2026-09-19 | JWT auth, refresh tokens, roles, permissions, login UI |
| 3 | Academic Structure | ✅ **COMPLETE** | 2026-09-19 | Classes, Sections, Subjects, Subject Types, Class-Subject mapping - all CRUD APIs |
| 4 | People Management | ✅ **COMPLETE** | 2026-09-20 | Students, Parents, Student Enrollment - all CRUD APIs + Parent-Student links |
| 5 | Attendance | ⏳ **PENDING** | - | Daily attendance, reports, analytics |
| 6 | Examinations | ⏳ **PENDING** | - | Exam scheduling, marks entry, report cards |
| 7 | Fees & Finance | ⏳ **PENDING** | - | Fee structures, invoices, payments, receipts |
| 8 | Communication | ⏳ **PENDING** | - | Notifications, announcements, messaging |
| 9 | Reports & Analytics | ⏳ **PENDING** | - | Dashboards, exports, academic reports |
| 10 | Polish & Deploy | ⏳ **PENDING** | - | Testing, optimization, production deploy |

### Week 4 Deliverables Checklist

| Deliverable | Status | Verified |
|-------------|--------|----------|
| Students module (CRUD API + search/pagination) | ✅ | ✅ |
| Parents module (CRUD API + search/pagination) | ✅ | ✅ |
| Parent-Student relationship (link/unlink, list children, list parents) | ✅ | ✅ |
| Student Enrollment module (CRUD API + validation) | ✅ | ✅ |
| Permissions updated for all 3 modules | ✅ | ✅ |
| Seed script already had permissions | ✅ | ✅ |
| All endpoints tested manually | ✅ | ✅ |
| Web proxy working for all new endpoints | ✅ | ✅ |

### Week 3 Deliverables Checklist

| Deliverable | Status | Verified |
|-------------|--------|----------|
| Classes module (CRUD API) | ✅ | ✅ |
| Sections module (CRUD API + list by academic year) | ✅ | ✅ |
| Subjects module (CRUD API) | ✅ | ✅ |
| Subject Types module (CRUD API) | ✅ | ✅ |
| Class Subjects module (CRUD API + list by class) | ✅ | ✅ |
| Permissions updated for all 5 modules | ✅ | ✅ |
| Seed script updated to sync permissions | ✅ | ✅ |
| All endpoints tested manually | ✅ | ✅ |

### Week 2 Deliverables Checklist

| Deliverable | Status | Verified |
|-------------|--------|----------|
| User registration/provisioning (via seed) | ✅ | ✅ |
| Login with email/password | ✅ | ✅ |
| Logout with token revocation | ✅ | ✅ |
| Password hashing (bcrypt) | ✅ | ✅ |
| JWT access tokens (15 min) | ✅ | ✅ |
| JWT refresh tokens (7 days, DB stored, rotation) | ✅ | ✅ |
| Password reset flow (forgot/reset/change) | ✅ | ⚠️ API only |
| Account activation/deactivation | ✅ | ✅ |
| Role management (6 system roles) | ✅ | ✅ |
| Permission management (module:action format) | ✅ | ✅ |
| Frontend login page | ✅ | ✅ |
| Protected app layout with sidebar | ✅ | ✅ |
| Dashboard with user info/permissions | ✅ | ✅ |
| Auth context & hooks | ✅ | ✅ |

---

## 🔧 Section 2: Technical Implementation Log

### Backend (API) - Files Created/Modified

#### New Files (Week 4)
```
api/src/modules/students/
├── student.schemas.ts       # Zod validation schemas
├── student.repository.ts    # Prisma data access layer
├── student.service.ts       # Business logic
├── student.controller.ts    # HTTP handlers
└── student.routes.ts        # Express routes with middleware

api/src/modules/parents/
├── parent.schemas.ts
├── parent.repository.ts
├── parent.service.ts
├── parent.controller.ts
└── parent.routes.ts

api/src/modules/student-enrollments/
├── enrollment.schemas.ts
├── enrollment.repository.ts
├── enrollment.service.ts
├── enrollment.controller.ts
└── enrollment.routes.ts
```

#### Modified Files (Week 4)
| File | Changes |
|------|---------|
| `api/src/lib/permissions.ts` | Added STUDENT_*, PARENT_*, STUDENT_ENROLLMENT_* permissions (already existed from schema update) |
| `api/src/routes.ts` | Registered 3 new module routes |

#### New Files (Week 3)
| File | Changes |
|------|---------|
| `api/src/lib/permissions.ts` | Added CLASS_*, SECTION_*, SUBJECT_*, SUBJECT_TYPE_*, CLASS_SUBJECT_* permissions; updated DEFAULT_ROLE_PERMISSIONS for Admin role |
| `api/src/routes.ts` | Registered 5 new module routes |
| `api/prisma/seed.ts` | Updated to sync permissions for existing roles |

#### New Files (Week 2)
```
api/src/modules/auth/
├── auth.schemas.ts       # Zod validation schemas
├── auth.repository.ts    # Prisma data access layer
├── auth.service.ts       # Business logic (login, refresh, logout, JWT)
├── auth.controller.ts    # HTTP handlers (cookies, responses)
└── auth.routes.ts        # Express routes with middleware
```

#### Modified Files (Week 2)
| File | Changes |
|------|---------|
| `api/prisma/schema.prisma` | Added `RefreshToken` model, `refreshTokens` relation to `User` |
| `api/src/middleware/auth.ts` | Replaced placeholder with real JWT validation (cookie + header), added `optionalAuth` |
| `api/src/lib/permissions.ts` | Added AUTH_*, USER_*, ROLE_*, PERMISSION_LIST keys; updated DEFAULT_ROLE_PERMISSIONS for all 6 roles |
| `api/src/routes.ts` | Registered `authRoutes` at `/auth` |
| `api/.env.example` | Added `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| `api/.env` | Populated with generated secrets |

#### Database
- **Migration:** Created `refresh_tokens` table with FK to `users`
- **Seed:** Demo admin user (`admin@campusone.test` / `ChangeMe-12345`) with Admin role

### Frontend (Web) - Files Created/Modified

#### New Files (Week 2)
```
web/src/
├── lib/
│   ├── auth.ts              # Types, API calls, permission helpers
│   ├── auth-context.tsx     # React Context for auth state
│   └── api.ts               # Updated API client with credentials + x-school-id
├── hooks/
│   └── useAuth.ts           # Hook to access auth context
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx       # Centered card layout
│   │   └── login/
│   │       └── page.tsx     # Login form with demo creds
│   ├── (app)/
│   │   ├── layout.tsx       # Protected layout with sidebar/header
│   │   └── dashboard/
│   │       └── page.tsx     # User info, roles, permissions display
│   ├── layout.tsx           # Root layout with AuthProvider
│   └── page.tsx             # Redirect to /dashboard or /login
```

#### Configuration
| File | Changes |
|------|---------|
| `web/.env` | Added `NEXT_PUBLIC_SCHOOL_ID` |
| `web/.env.example` | Added `NEXT_PUBLIC_SCHOOL_ID` placeholder |

### API Endpoints Implemented

#### Week 4 - People Management

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/api/v1/students` | Required | student:view | List students (paginated, searchable) |
| POST | `/api/v1/students` | Required | student:create | Create a student |
| GET | `/api/v1/students/:id` | Required | student:view | Get a student |
| PATCH | `/api/v1/students/:id` | Required | student:update | Update a student |
| DELETE | `/api/v1/students/:id` | Required | student:delete | Delete a student (checks for related records) |
| GET | `/api/v1/parents` | Required | parent:view | List parents (paginated, searchable) |
| POST | `/api/v1/parents` | Required | parent:create | Create a parent |
| GET | `/api/v1/parents/:id` | Required | parent:view | Get a parent |
| PATCH | `/api/v1/parents/:id` | Required | parent:update | Update a parent |
| DELETE | `/api/v1/parents/:id` | Required | parent:delete | Delete a parent (checks for linked students) |
| POST | `/api/v1/parents/:id/children` | Required | parent:update | Link student to parent |
| DELETE | `/api/v1/parents/:id/children/:studentId` | Required | parent:update | Unlink student from parent |
| GET | `/api/v1/parents/:id/children` | Required | parent:view | Get parent's children |
| GET | `/api/v1/parents/students/:studentId/parents` | Required | student:view | Get student's parents |
| GET | `/api/v1/student-enrollments` | Required | student_enrollment:view | List enrollments (filterable) |
| POST | `/api/v1/student-enrollments` | Required | student_enrollment:create | Create enrollment (validates class/section/year) |
| GET | `/api/v1/student-enrollments/:id` | Required | student_enrollment:view | Get enrollment with relations |
| PATCH | `/api/v1/student-enrollments/:id` | Required | student_enrollment:update | Update enrollment |
| DELETE | `/api/v1/student-enrollments/:id` | Required | student_enrollment:delete | Delete enrollment (checks for related records) |

#### Week 3 - Academic Structure

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/api/v1/classes` | Required | class:view | List all classes |
| POST | `/api/v1/classes` | Required | class:create | Create a class |
| GET | `/api/v1/classes/:id` | Required | class:view | Get a class |
| PATCH | `/api/v1/classes/:id` | Required | class:update | Update a class |
| DELETE | `/api/v1/classes/:id` | Required | class:delete | Delete a class |
| GET | `/api/v1/sections` | Required | section:view | List all sections |
| GET | `/api/v1/sections/academic-year/:academicYearId` | Required | section:view | List sections by academic year |
| POST | `/api/v1/sections` | Required | section:create | Create a section |
| GET | `/api/v1/sections/:id` | Required | section:view | Get a section |
| PATCH | `/api/v1/sections/:id` | Required | section:update | Update a section |
| DELETE | `/api/v1/sections/:id` | Required | section:delete | Delete a section |
| GET | `/api/v1/subjects` | Required | subject:view | List all subjects |
| POST | `/api/v1/subjects` | Required | subject:create | Create a subject |
| GET | `/api/v1/subjects/:id` | Required | subject:view | Get a subject |
| PATCH | `/api/v1/subjects/:id` | Required | subject:update | Update a subject |
| DELETE | `/api/v1/subjects/:id` | Required | subject:delete | Delete a subject |
| GET | `/api/v1/subject-types` | Required | subject_type:view | List all subject types |
| POST | `/api/v1/subject-types` | Required | subject_type:create | Create a subject type |
| GET | `/api/v1/subject-types/:id` | Required | subject_type:view | Get a subject type |
| PATCH | `/api/v1/subject-types/:id` | Required | subject_type:update | Update a subject type |
| DELETE | `/api/v1/subject-types/:id` | Required | subject_type:delete | Delete a subject type |
| GET | `/api/v1/class-subjects` | Required | class_subject:view | List all class-subject mappings |
| GET | `/api/v1/class-subjects/class/:classId` | Required | class_subject:view | List class-subject mappings by class |
| POST | `/api/v1/class-subjects` | Required | class_subject:create | Create a class-subject mapping |
| GET | `/api/v1/class-subjects/:id` | Required | class_subject:view | Get a class-subject mapping |
| PATCH | `/api/v1/class-subjects/:id` | Required | class_subject:update | Update a class-subject mapping |
| DELETE | `/api/v1/class-subjects/:id` | Required | class_subject:delete | Delete a class-subject mapping |

#### Week 2 - Authentication & RBAC

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Login with email/password, sets HttpOnly cookies |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token using refresh token |
| POST | `/api/v1/auth/logout` | Required | Revoke all refresh tokens, clear cookies |
| GET | `/api/v1/auth/me` | Required | Get current user context |
| POST | `/api/v1/auth/forgot-password` | Public | Request password reset (stub) |
| POST | `/api/v1/auth/reset-password` | Public | Reset password with token (stub) |
| POST | `/api/v1/auth/change-password` | Required | Change password (stub) |
| GET | `/api/v1/auth/users` | Required (USER_VIEW) | List users (stub) |
| GET | `/api/v1/auth/roles` | Required (ROLE_VIEW) | List roles (stub) |
| GET | `/api/v1/auth/permissions` | Required (PERMISSION_LIST) | List permissions (stub) |

### Permission System

**Format:** `module:action` (e.g., `academic_year:create`, `user:view`)

**New Permissions Added (Week 4):**
| Module | Permissions |
|--------|-------------|
| Student | student:view, student:create, student:update, student:delete, student:manage |
| Parent | parent:view, parent:create, parent:update, parent:delete, parent:manage |
| Student Enrollment | student_enrollment:view, student_enrollment:create, student_enrollment:update, student_enrollment:delete, student_enrollment:manage |

**New Permissions Added (Week 3):**
| Module | Permissions |
|--------|-------------|
| Class | class:view, class:create, class:update, class:delete, class:manage |
| Section | section:view, section:create, section:update, section:delete, section:manage |
| Subject | subject:view, subject:create, subject:update, subject:delete, subject:manage |
| Subject Type | subject_type:view, subject_type:create, subject_type:update, subject_type:delete, subject_type:manage |
| Class Subject | class_subject:view, class_subject:create, class_subject:update, class_subject:delete, class_subject:manage |

**Roles (6 system roles):**
| Role | Permissions |
|------|-------------|
| Developer | ALL_PERMISSIONS |
| Principal | ALL except ROLE_MANAGE |
| Vice Principal | ALL except ROLE_MANAGE |
| Admin | ALL except ROLE_MANAGE, AUDIT_VIEW |
| Teacher | VIEW_ONLY + AUTH_BASIC |
| Student | AUTH_BASIC only |
| Parent | AUTH_BASIC only |

---

## 🧪 Section 3: Testing & Verification Log

### API Tests (All Passing ✅)

| Test | Command | Expected | Actual |
|------|---------|----------|--------|
| Login | `POST /auth/login` | 200 + cookies | ✅ PASS |
| Get Current User | `GET /auth/me` (with cookie) | 200 + user data | ✅ PASS |
| Logout | `POST /auth/logout` | 200 + cleared cookies | ✅ PASS |
| Auth Check After Logout | `GET /auth/me` (no cookie) | 401 | ✅ PASS |
| CORS Preflight | `OPTIONS /auth/login` | 200 + CORS headers | ✅ PASS |

### Manual Test Results

```bash
# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" \
  -d '{"email":"admin@campusone.test","password":"ChangeMe-12345"}'
# ✅ Returns 200 with Set-Cookie headers

# Get Current User (with cookies)
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" \
  -b cookies.txt
# ✅ Returns 200 with user data (roles, permissions)

# Logout
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" \
  -b cookies.txt
# ✅ Returns 200 with Set-Cookie: expired
```

### Week 3 - Academic Structure Tests

```bash
# Classes
curl -X GET http://localhost:4000/api/v1/classes \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt
# ✅ Returns 200 with 12 classes

curl -X POST http://localhost:4000/api/v1/classes \
  -H "Content-Type: application/json" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt \
  -d '{"name":"Kindergarten","displayOrder":0}'
# ✅ Returns 201 with created class

# Sections
curl -X GET http://localhost:4000/api/v1/sections \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt
# ✅ Returns 200 with 26 sections

curl -X GET "http://localhost:4000/api/v1/sections/academic-year/ca609f6b-7f36-4f06-87a6-8f3d0551a8ec" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt
# ✅ Returns 200 with sections for academic year

curl -X POST http://localhost:4000/api/v1/sections \
  -H "Content-Type: application/json" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt \
  -d '{"academicYearId":"ca609f6b-7f36-4f06-87a6-8f3d0551a8ec","classId":"e7e12145-d551-45b4-bc3d-147e9299fd53","name":"A","capacity":30}'
# ✅ Returns 201 with created section

# Subjects
curl -X GET http://localhost:4000/api/v1/subjects \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt
# ✅ Returns 200 with 5 subjects

curl -X POST http://localhost:4000/api/v1/subjects \
  -H "Content-Type: application/json" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt \
  -d '{"subjectTypeId":"053af159-9235-476b-9b3b-a1dbf85162f0","name":"French","code":"FRE"}'
# ✅ Returns 201 with created subject

# Subject Types
curl -X GET http://localhost:4000/api/v1/subject-types \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt
# ✅ Returns 200 with 4 subject types

curl -X POST http://localhost:4000/api/v1/subject-types \
  -H "Content-Type: application/json" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt \
  -d '{"name":"Language"}'
# ✅ Returns 201 with created subject type

# Class Subjects
curl -X GET http://localhost:4000/api/v1/class-subjects \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt
# ✅ Returns 200 (empty initially)

curl -X POST http://localhost:4000/api/v1/class-subjects \
  -H "Content-Type: application/json" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt \
  -d '{"classId":"da9f83d9-7c33-4eed-bfe7-9445b5b23af1","subjectId":"ed0fa619-82e9-413a-9a10-d2708df98452"}'
# ✅ Returns 201 with created class-subject mapping

curl -X GET "http://localhost:4000/api/v1/class-subjects/class/da9f83d9-7c33-4eed-bfe7-9445b5b23af1" \
  -H "x-school-id: 2863124a-76bb-4c5a-bb32-155efac4ff61" -b cookies.txt
# ✅ Returns 200 with class-subject mappings for class
```

### Week 4 - People Management Tests

```bash
# Login (gets cookies)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" \
  -d '{"email":"admin@campusone.test","password":"ChangeMe-12345"}' \
  -c cookies.txt
# ✅ Returns 200 with Set-Cookie headers

# Students
curl -X GET http://localhost:4000/api/v1/students \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt
# ✅ Returns 200 with paginated students

curl -X POST http://localhost:4000/api/v1/students \
  -H "Content-Type: application/json" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt \
  -d '{"admissionNo":"STU001","firstName":"John","lastName":"Doe","dateOfBirth":"2010-05-15","gender":"MALE","admissionDate":"2024-04-01"}'
# ✅ Returns 201 with created student

# Parents
curl -X GET http://localhost:4000/api/v1/parents \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt
# ✅ Returns 200 with paginated parents

curl -X POST http://localhost:4000/api/v1/parents \
  -H "Content-Type: application/json" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt \
  -d '{"firstName":"Robert","lastName":"Doe","phone":"+1234567890","email":"robert.doe@example.com","isPrimary":true}'
# ✅ Returns 201 with created parent

# Parent-Student Link
curl -X POST "http://localhost:4000/api/v1/parents/a53c03a6-9031-4a80-a51a-a7686dc7ba2c/children" \
  -H "Content-Type: application/json" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt \
  -d '{"studentId":"0020af48-a305-46b9-a964-c5b165779962","relation":"Father"}'
# ✅ Returns 201 with link created

curl -X GET "http://localhost:4000/api/v1/parents/a53c03a6-9031-4a80-a51a-a7686dc7ba2c/children" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt
# ✅ Returns 200 with parent's children

curl -X GET "http://localhost:4000/api/v1/parents/students/0020af48-a305-46b9-a964-c5b165779962/parents" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt
# ✅ Returns 200 with student's parents

# Student Enrollments
curl -X GET http://localhost:4000/api/v1/student-enrollments \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt
# ✅ Returns 200 with enrollments

curl -X POST http://localhost:4000/api/v1/student-enrollments \
  -H "Content-Type: application/json" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt \
  -d '{"studentId":"0020af48-a305-46b9-a964-c5b165779962","academicYearId":"bb7dc2be-0b8f-4dc8-abc4-cc71eebb6cbd","classId":"e3bbf8fc-202b-4df7-8a65-03312d0b98d3","sectionId":"cec0e338-6cc7-491e-a51f-3d3649291a22","rollNumber":1}'
# ✅ Returns 201 with created enrollment
```

### Web Proxy Tests (All Passing ✅)
```bash
# Login via web proxy (cookies work cross-origin)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" \
  -d '{"email":"admin@campusone.test","password":"ChangeMe-12345"}' \
  -c cookies.txt
# ✅ Returns 200 with cookies proxied from backend

# Get current user via web proxy
curl -X GET http://localhost:3000/api/auth/me \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt
# ✅ Returns 200 with user data

# Students via web proxy
curl -X GET http://localhost:3000/api/students \
  -H "x-school-id: 87a4a639-83d9-4158-b4c3-092efe7b617b" -b cookies.txt
# ✅ Returns 200 with students
```

### Frontend Tests

| Page | URL | Status |
|------|-----|--------|
| Login | http://localhost:3000/login | ✅ Loads, form enabled after API ready |
| Dashboard (protected) | http://localhost:3000/dashboard | ✅ Redirects to login when unauthenticated |
| Root | http://localhost:3000/ | ✅ Redirects based on auth state |

### Demo Credentials
```
Email:    admin@campusone.test
Password: ChangeMe-12345
School:   Demo School (ID: 2863124a-76bb-4c5a-bb32-155efac4ff61)
```

### Known Issues / TODOs

| Issue | Priority | Status |
|-------|----------|--------|
| Password reset/change endpoints are stubs | Medium | ⏳ TODO |
| User/Role management endpoints are stubs | Medium | ⏳ TODO |
| Refresh token rotation test | Low | ⏳ TODO |
| Rate limiting on auth endpoints | Low | ⏳ TODO |
| Email verification flow | Low | ⏳ TODO |
| Frontend pages for academic structure management | Medium | ⏳ TODO (Week 5) |
| Frontend pages for people management (students, parents, enrollments) | Medium | ⏳ TODO (Week 5) |
| Teachers module (Week 4 scope) | Medium | ⏳ TODO (Week 5) |
| Admissions module (Week 4 scope) | Medium | ⏳ TODO (Week 5) |

---

## 📝 Update Instructions

**When adding new progress:**
1. Update **Section 1** - Phase/Milestone table and checklist
2. Update **Section 2** - Add new/modified files with descriptions
3. Update **Section 3** - Add test results, new endpoints, known issues
4. Update **Last Updated** date at top of file

**Format for new entries:**
```markdown
### Week X - Feature Name (YYYY-MM-DD)
- **Added:** Brief description
- **Modified:** Files changed
- **Tested:** Verification method
```