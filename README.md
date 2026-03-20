# Blogging API

A REST API for a blogging platform built with **Express**, **TypeScript**, **MongoDB (Mongoose)**, and **Cloudinary**. This document explains the full architecture and the reasoning behind every significant technical decision in the codebase.

---

## Table of Contents

1. [Running the Project](#running-the-project)
2. [Architecture Overview](#architecture-overview)
3. [Request Lifecycle](#request-lifecycle)
4. [Authentication & JWT Strategy](#authentication--jwt-strategy)
5. [Polymorphic Design — Comments & Reactions](#polymorphic-design--comments--reactions)
6. [Why `$graphLookup` for Comment Deletion](#why-graphlookup-for-comment-deletion)
7. [Why `$facet` for Pagination](#why-facet-for-pagination)
8. [Upsert Pattern for Reactions](#upsert-pattern-for-reactions)
9. [Media Handling — Multer → Cloudinary](#media-handling--multer--cloudinary)
10. [Request Validation with Zod](#request-validation-with-zod)
11. [Email Verification & Password Reset](#email-verification--password-reset)
12. [Redis Caching](#redis-caching)
13. [Rate Limiting](#rate-limiting)
13. [Error Handling](#error-handling)
14. [Database Indexes](#database-indexes)
15. [API Reference](#api-reference)
16. [Environment Variables](#environment-variables)
17. [Project Structure](#project-structure)

---

## Running the Project

```bash
# Local dev (requires .env with MongoDB URI + Cloudinary creds)
npm run dev

# Docker (app + MongoDB + Redis — recommended)
docker-compose up --build

# Swagger UI
http://localhost:5001/api-docs
```

---

## Architecture Overview

```
Request → Route → Middleware(s) → Controller → Service → Model → MongoDB
```

| Layer | Location | Responsibility |
|---|---|---|
| Routes | `src/routes/` | Define paths and attach middleware chains |
| Controllers | `src/controllers/` | Parse + validate request, call service, send response |
| Services | `src/services/` | All business logic and database queries |
| Models | `src/models/` | Mongoose schemas, instance methods |
| Middlewares | `src/middlewares/` | Auth (JWT), file upload (Multer), post/comment verification |
| Utils | `src/utils/` | `ApiError`, `ApiResponse`, `asyncHandler`, Cloudinary helpers |
| Validators | `src/validators/` | Zod schemas for every request body and query string |

---

## Request Lifecycle

A typical authenticated request goes through this chain:

```
POST /api/v1/post/:postId/comments/:commentId/reactions

1. app.ts          → express.json(), cookieParser()
2. reaction_route  → verfyJwt (auth middleware)
                   → verifyPost (confirm post exists, attach req.postId)
                   → verifyComment (confirm comment exists, attach req.commentId)
3. addCommentReaction controller
                   → ReactionBodySchema.parse(req.body)   ← Zod validation
                   → ReactionService.addReactionToComment(...)
4. ReactionService → Reaction.findOneAndUpdate(..., { upsert: true })
5. controller      → res.json(new ApiResponse(...))
```

Every async controller is wrapped in `asyncHandler`, which catches promise rejections and forwards them to Express's global error handler — so no try/catch is needed inside controllers.

---

## Authentication & JWT Strategy

### Two-token system

The API uses two separate JWTs:

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| Access token | Short (minutes/hours) | `httpOnly` cookie | Sent on every request to prove identity |
| Refresh token | Long (days/weeks) | `httpOnly` cookie + MongoDB | Used once to silently get a new access token |

Both tokens are `httpOnly` cookies, meaning JavaScript in the browser cannot read them. This prevents XSS attacks from stealing tokens.

### Token rotation on expiry

The `verfyJwt` middleware handles expiry transparently:

```
1. Verify access token
   → Valid: attach req.userEmail + req.userID, call next()
   → TokenExpiredError:
       a. Read refreshToken from cookie
       b. Verify it against REFRESH_TOKEN_SECRET
       c. Check it matches what's stored in the User document
          (prevents reuse of old refresh tokens after logout)
       d. Issue a new accessToken cookie
       e. call next() — the original request succeeds
   → Any other error: throw 401
```

**Why check `user.refreshToken !== refreshToken`?**
When the user logs out, `refreshToken` is cleared from the database. If an attacker captured the refresh token before logout, their token no longer matches the DB value, so the rotation is blocked.

### Authorization header fallback

The middleware also accepts `Authorization: Bearer <token>` as a fallback for non-browser clients (e.g. mobile apps, CLI tools) that cannot use cookies.

---

## Polymorphic Design — Comments & Reactions

Both `Comment` and `Reaction` target more than one entity type. Instead of creating separate tables (`post_comments`, `comment_reactions`, etc.), they use a **polymorphic association** via Mongoose's `refPath`.

### Comment model

```
commentableId   — ObjectId pointing to a Post OR Comment
commentableType — "Post" | "Comment"  (tells Mongoose which collection to join)
parentComment   — ObjectId of parent Comment (null for top-level)
```

A top-level comment on a post:
```json
{ "commentableId": "<postId>", "commentableType": "Post", "parentComment": null }
```

A reply to a comment:
```json
{ "commentableId": "<parentCommentId>", "commentableType": "Comment", "parentComment": "<parentCommentId>" }
```

### Reaction model

```
reactableId   — ObjectId pointing to a Post OR Comment
reactableType — "Post" | "Comment"
value         — 1 (LIKE) | -1 (DISLIKE)
```

**Why polymorphic instead of separate models?**
- The reaction and comment logic is identical regardless of the target — same upsert, same pagination, same delete. Having one model avoids duplicating the schema and service logic.
- `refPath` lets Mongoose resolve the join (`populate`) correctly at query time without any extra code.
- A compound unique index `{ user, reactableId, reactableType }` enforces one reaction per user per target across both Posts and Comments in a single constraint.

---

## Why `$graphLookup` for Comment Deletion

Comments are a **tree structure** — a reply can have replies, which can have further replies, to any depth. When you delete a comment, all descendants must also be deleted.

### The naive approach (wrong)

```
delete comment → delete its direct children → delete their children → ...
```

This requires N round-trips to the database (one per level of nesting). With deep threads, this is slow and non-atomic.

### The `$graphLookup` approach

`$graphLookup` is MongoDB's built-in **graph traversal** operator. It walks a recursive relationship in a single aggregation stage:

```js
$graphLookup: {
  from: "comments",
  startWith: "$_id",            // start from the comment being deleted
  connectFromField: "_id",      // follow _id outward...
  connectToField: "parentComment", // ...to documents that point to it as their parent
  as: "descendants",            // collect all reachable nodes here
}
```

This returns the entire subtree — all replies at all depths — in **one database round-trip**. Then a single `deleteMany` removes the root comment and every descendant at once.

**Why not a recursive function in application code?**
- Each recursion level = one more DB query. `$graphLookup` does it all server-side.
- The traversal happens inside MongoDB, which can use the `parentComment` index efficiently.
- The result is a flat array of IDs, easy to pass to `deleteMany`.

---

## Why `$facet` for Pagination

Pagination normally requires two queries: one `find()` for the page of results and one `countDocuments()` for the total. `$facet` runs both in a single aggregation pipeline:

```js
$facet: {
  comments: [
    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ],
  total: [
    { $count: "count" },
  ],
}
```

MongoDB executes both branches in parallel against the same filtered dataset. The result is one document:

```json
{ "comments": [...], "total": [{ "count": 42 }] }
```

**Why not two separate queries?**
- Two separate queries create a **TOCTOU (time-of-check/time-of-use) race**: a document could be inserted between the `count` call and the `find` call, making the count inconsistent with the returned page.
- `$facet` evaluates both branches against the same snapshot, so the total always matches the data.
- It also saves one network round-trip per paginated request.

For posts (`PostService.getPosts`), `Promise.all([countDocuments, find])` is used instead — both run in parallel but as two separate queries. This is fine for simple collection-level counts without a preceding `$match` pipeline.

---

## Upsert Pattern for Reactions

A user can only have one reaction per post/comment, but they can change it (LIKE → DISLIKE). The naive implementation would be:

```
1. Check if reaction exists
2. If yes → update
3. If no → create
```

This is a **read-then-write** pattern that has a race condition: two concurrent requests could both see "no reaction" and both insert, violating the unique constraint.

Instead, a single `findOneAndUpdate` with `upsert: true` is used:

```js
Reaction.findOneAndUpdate(
  { user: userID, reactableId: postID },      // filter
  {
    $set: { value: reaction },                // always update the value
    $setOnInsert: { reactableType: "Post" },  // only set these on INSERT
  },
  { upsert: true, new: true },
)
```

- **If the reaction exists** → `$set` updates the value. `$setOnInsert` is ignored.
- **If it doesn't exist** → MongoDB atomically inserts a new document with both `$set` and `$setOnInsert` fields applied.

`$setOnInsert` is used for `reactableType` because it's immutable — it should only be written on creation. The unique index `{ user, reactableId, reactableType }` acts as a final safety net if two concurrent upserts race.

---

## Media Handling — Multer → Cloudinary

File uploads flow through two layers:

### 1. Multer (`upload_middleware.ts`)

Multer intercepts `multipart/form-data` requests and parses the file. Memory storage (`multer.memoryStorage()`) is used — the file lands in `req.file.buffer` as raw bytes, never written to disk. This matters in a Docker container where disk writes inside the container are ephemeral and unreliable.

Constraints enforced at the middleware level:
- Max file size: 5MB
- Allowed types: images only (validated via `mimetype`)

### 2. Cloudinary (`cloudinary_util.ts`)

The buffer is piped directly to Cloudinary using a stream:

```
req.file.buffer → upload_stream → Cloudinary CDN
```

The response includes `secure_url` (the public CDN URL) and `public_id` (the identifier used to delete the asset later). Both are stored in a `MediaSchema` embedded subdocument on the `Post` or `User` document.

### Deletion on update/delete

When a post is edited with a new file, or when a post is deleted:
1. The old `public_id` is read from the existing document.
2. `deleteFromCloudinary(public_id)` removes the asset from the CDN.
3. The new asset is uploaded (on edit) or no upload happens (on delete).

This prevents orphaned assets from accumulating in Cloudinary storage.

---

## Request Validation with Zod

Every request body and query string is validated with Zod before reaching the service layer. Validation is done inline at the top of each controller, immediately after the request arrives:

```ts
const { email, password } = LoginSchema.parse(req.body);
```

**Why inline in the controller vs. as a separate middleware?**
- Keeps the validation co-located with the handler that uses the data — easier to see what shape a request needs to be.
- `parse()` throws a `ZodError` on failure. Since controllers are wrapped in `asyncHandler`, the error propagates automatically to the global error handler.
- Zod infers TypeScript types from the schema, so the parsed result is fully typed — no need to separately maintain TypeScript interfaces for request bodies.

**`z.coerce` for query strings**
All query parameters arrive as strings (e.g. `"25"`, `"true"`). `z.coerce.number()` and `z.coerce.date()` automatically convert them, replacing the manual `Number(pageNo ?? 1)` calls that were scattered across controllers.

---

## Email Verification & Password Reset

OTPs are 6-digit numeric codes generated with `Math.random`, stored in Redis with a 10-minute TTL, and sent via Nodemailer (Gmail SMTP).

Two separate key namespaces prevent cross-flow OTP reuse:

| Flow | Redis key | Sent when |
|---|---|---|
| Email verification | `otp:{email}` | `POST /send-otp` |
| Password reset | `otp:reset:{email}` | `POST /forgot-password` |

### Forgot password decision tree

```
POST /forgot-password { email }
  → user not found         → 404
  → email_verified = false → 403 (account cannot be recovered)
  → email_verified = true  → send reset OTP → 200
```

Unverified accounts are treated as lost — this keeps the flow simple and avoids a two-step hijack path where an attacker uses forgot-password to trigger email verification.

---

## Redis Caching

Redis is used as an in-memory store for operations that benefit from fast key-value access without hitting MongoDB. The `RedisUtil` class (`src/utils/redis_util.ts`) wraps the `redis` client with typed helpers:

| Method | Redis command | Use case |
|---|---|---|
| `set(key, value, ttl)` | `SETEX` | Cache a JSON value with an expiry |
| `get(key)` | `GET` | Read a cached value |
| `del(key)` | `DEL` | Invalidate a single key |
| `incr(key)` | `INCR` | Atomically increment a counter |
| `expire(key, seconds)` | `EXPIRE` | Set or reset a TTL on an existing key |
| `ttl(key)` | `TTL` | Inspect remaining lifetime |
| `delByPattern(pattern)` | `SCAN` + `DEL` | Bulk-invalidate keys matching a glob (e.g. `post:*`) |

### Connection

The Redis client (`src/redis/index.ts`) reads `REDIS_HOST` from the environment so it resolves correctly whether running locally (`localhost`) or inside Docker (service name `redis`):

```ts
createClient({ socket: { host: env.REDIS_HOST, port: 6379 } })
```

---

## Rate Limiting

A global rate limiter middleware (`src/middlewares/rate_limiter.ts`) is applied to every API route before any route handler runs.

### How it works

- **Key:** `rate_limit:<req.path>` — one counter per endpoint path (e.g. `rate_limit:/api/v1/auth/login`)
- **Algorithm:** INCR + EXPIRE on first hit (classic sliding-window approximation)
- **Limit:** 15 requests per 5-second window
- **Reset:** automatic — Redis deletes the key after the TTL expires, resetting the counter

```
Request arrives
  → INCR rate_limit:/api/v1/auth/login   (count = N)
  → if N === 1: EXPIRE key 5             (start the 5s window)
  → if N > 15:  throw ApiError(429)
  → else:       next()
```

### Why INCR + EXPIRE instead of a timestamp list?

- `INCR` is an atomic Redis operation — no race condition even under concurrent requests.
- Setting `EXPIRE` only when `count === 1` means the window is not extended by subsequent requests within the same window.
- Zero application-side cleanup: Redis handles expiry natively.

### Response on limit exceeded

```json
HTTP 429 Too Many Requests
{ "success": false, "message": "Too many requests. Please try again later." }
```

---

## Error Handling

### `ApiError`

A custom error class that extends `Error`:

```ts
throw new ApiError(404, "Post not found");
```

It carries a `statusCode` alongside the message, which the global error handler in `app.ts` uses to set the HTTP response status.

### `asyncHandler`

Wraps every async controller so promise rejections are caught and forwarded to Express's error handler:

```ts
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

Without this, an unhandled promise rejection in a controller would crash the process (in older Node) or result in a hanging request (in newer Node).

### Global error handler (`app.ts`)

```
ApiError   → res.status(err.statusCode).json({ success: false, message, errors })
Other      → res.status(500).json({ message: "Internal server error" })
```

This single handler covers all routes. Controllers never call `res.status(500)` themselves — they only throw, and the handler formats the response.

---

## Database Indexes

Indexes are declared on the Mongoose schemas and created automatically on startup.

| Model | Index | Reason |
|---|---|---|
| `User` | `email` (unique) | Login lookup and uniqueness enforcement |
| `Post` | `owner` | Fetch all posts by a user (`GET /post/user/:userId`) |
| `Post` | `createdAt DESC` | Default feed sort — most recent first |
| `Comment` | `{ commentableId, commentableType }` | Fetch all comments on a post/comment |
| `Comment` | `parentComment` | `$graphLookup` traversal for nested replies |
| `Comment` | `createdAt DESC` | Sort comments chronologically |
| `Reaction` | `{ user, reactableId, reactableType }` (unique) | Enforce one reaction per user per target; speeds up upsert filter |
| `Reaction` | `{ reactableId, reactableType }` | Fetch all reactions on a post/comment |

---

## API Reference

Swagger UI is available at **`http://localhost:5001/api-docs`** when the app is running.

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register-user` | No | Create account |
| POST | `/login` | No | Login, sets cookies |
| POST | `/logout` | No | Clears cookies |
| POST | `/change-password` | Yes | Change password |
| PATCH | `/profile-picture` | Yes | Upload/replace profile picture |
| POST | `/send-otp` | Yes | Send email verification OTP (10 min TTL) |
| POST | `/verify-otp` | Yes | Verify email OTP, sets `email_verified = true` |
| POST | `/forgot-password` | No | Sends reset OTP. Returns 403 if email is not verified (account unrecoverable) |
| POST | `/reset-password` | No | Verify reset OTP and set new password |

### Posts — `/api/v1/post`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Paginated feed with filters (title, media, sort) |
| POST | `/` | Create post (multipart, optional file) |
| GET | `/user/:userId` | All posts by a specific user |
| GET | `/:postId` | Single post |
| PUT | `/:postId` | Edit post (partial update) |
| DELETE | `/:postId` | Delete post + Cloudinary media |

### Comments — `/api/v1/post/:postId/comments`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Add top-level comment |
| GET | `/` | Paginated comments on a post |
| POST | `/:commentId/replies` | Reply to a comment |
| GET | `/:commentId/replies` | Paginated replies |
| PATCH | `/:commentId` | Edit comment (owner only) |
| DELETE | `/:commentId` | Delete comment + all descendants |

### Post Reactions — `/api/v1/post/:postId/reactions`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Add or change reaction (1 = LIKE, -1 = DISLIKE) |
| DELETE | `/` | Remove reaction |
| GET | `/` | All reactions on a post |
| GET | `/user/:userId` | Reactions by a specific user |

### Comment Reactions — `/api/v1/post/:postId/comments/:commentId/reactions`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Add or change reaction on a comment |
| DELETE | `/` | Remove reaction from a comment |
| GET | `/` | All reactions on a comment |

---

## Environment Variables

All variables are validated at startup via `src/validators/env_validator.ts` using Zod. Missing or malformed values will crash the process with a clear error listing the invalid fields.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default: `5000`) | Server port |
| `MONGO_URI` | Yes | Full MongoDB connection string |
| `MONGO_ROOT_USERNAME` | Yes | MongoDB root user |
| `MONGO_ROOT_PASSWORD` | Yes | MongoDB root password |
| `MONGO_DATABASE` | Yes | MongoDB database name |
| `ACCESS_TOKEN_SECRET` | Yes | Secret for signing access JWTs |
| `ACCESS_TOKEN_EXPIRY` | Yes | Access token lifetime (e.g. `15m`) |
| `REFERESH_TOKEN_SECRET` | Yes | Secret for signing refresh JWTs |
| `REFRESH_TOKEN_EXPIRY` | Yes | Refresh token lifetime (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `CORS_ORIGIN` | No | Allowed CORS origin |
| `REDIS_HOST` | No (default: `localhost`) | Redis hostname; use `redis` in Docker |
| `RESEND_API_KEY` | Yes | Resend API key for transactional email |
| `EMAIL` | Yes | Gmail address used as the sender |
| `EMAIL_APP_PASSWORD` | Yes | Gmail app password for SMTP auth |

---

## Project Structure

```
src/
├── app.ts                    # Express app setup, middleware, route mounting
├── index.ts                  # DB connection + server start
├── swagger.ts                # OpenAPI 3.0 spec (served at /api-docs)
│
├── routes/
│   ├── auth_route.ts
│   ├── post_route.ts
│   ├── comment_route.ts
│   └── reaction_route.ts
│
├── controllers/              # Thin handlers: validate → call service → respond
│   ├── auth_controller.ts
│   ├── post_controller.ts
│   ├── comment_controller.ts
│   └── reaction_controller.ts
│
├── services/                 # All business logic
│   ├── auth_service.ts
│   ├── post_service.ts
│   ├── comment_service.ts    # $graphLookup, $facet
│   └── reaction_service.ts   # upsert pattern
│
├── models/                   # Mongoose schemas
│   ├── user_model.ts         # comparePassword, generateAccessToken/RefreshToken
│   ├── post_model.ts
│   ├── comment_model.ts      # refPath polymorphism
│   ├── reaction_model.ts     # refPath polymorphism, unique compound index
│   └── media_model.ts        # embedded subdocument schema
│
├── middlewares/
│   ├── auth_middleware.ts    # JWT verify + silent refresh token rotation
│   ├── rate_limiter.ts       # Global rate limit: 15 req / 5s per path (Redis INCR)
│   ├── reaction_middleware.ts # verifyPost, verifyComment
│   └── upload_middleware.ts  # Multer memory storage
│
├── config/
│   └── env.ts                # Calls dotenv.config() + validateEnv(), exports typed `env`
│
├── validators/               # Zod schemas, one file per controller
│   ├── auth_validator.ts
│   ├── env_validator.ts      # Zod schema for all env vars; exits on invalid config
│   ├── post_validator.ts
│   ├── comment_validator.ts
│   └── reaction_validator.ts
│
├── types/                    # TypeScript interfaces
│   ├── express.d.ts          # req.userEmail, req.userID, req.postId, req.commentId
│   ├── model_types/
│   └── request_types/
│
├── dtos/                     # Data transfer objects (controller → service boundary)
│   └── auth_dto.ts
│
├── redis/
│   └── index.ts              # Redis client (reads REDIS_HOST env var)
│
└── utils/
    ├── api_error.ts          # ApiError extends Error
    ├── api_response.ts       # Standardised response wrapper
    ├── async_handler.ts      # Wraps async controllers to forward errors
    ├── cloudinary_config.ts  # Cloudinary SDK init
    ├── cloudinary_util.ts    # uploadToCloudinary, deleteFromCloudinary
    ├── node_mailer_util.ts   # sendEmail via Gmail SMTP (Nodemailer)
    └── redis_util.ts         # RedisUtil: set/get/del/incr/expire/delByPattern
```
