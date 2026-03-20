const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Blogging API",
    version: "1.0.0",
    description:
      "REST API for a blogging platform. Supports posts, comments, reactions, and auth.",
  },
  servers: [
    {
      url: "http://localhost:5001/api/v1",
      description: "Local dev server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
      },
    },
    schemas: {
      MediaObject: {
        type: "object",
        properties: {
          url: { type: "string", example: "https://res.cloudinary.com/..." },
          public_id: { type: "string", example: "blogging/abc123" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
          first_name: { type: "string", example: "John" },
          last_name: { type: "string", example: "Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          dob: { type: "string", format: "date", example: "1995-06-15" },
          profile_url: { $ref: "#/components/schemas/MediaObject" },
          email_verified: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Post: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e2" },
          title: { type: "string", example: "My First Post" },
          content: { type: "string", example: "Hello world!" },
          owner: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
          media_url: { $ref: "#/components/schemas/MediaObject" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e3" },
          content: { type: "string", example: "Great post!" },
          owner: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
          commentableId: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e2" },
          commentableType: { type: "string", enum: ["Post", "Comment"] },
          parentComment: {
            type: "string",
            nullable: true,
            example: null,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Reaction: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e4" },
          user: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
          reactableId: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e2" },
          reactableType: { type: "string", enum: ["Post", "Comment"] },
          value: { type: "integer", enum: [1, -1], description: "1 = LIKE, -1 = DISLIKE" },
        },
      },
      PaginatedPosts: {
        type: "object",
        properties: {
          total: { type: "integer", example: 42 },
          pageNo: { type: "integer", example: 1 },
          itemPerPage: { type: "integer", example: 25 },
          posts: {
            type: "array",
            items: { $ref: "#/components/schemas/Post" },
          },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          response: {
            type: "object",
            properties: {
              statusCode: { type: "integer" },
              data: { type: "object" },
              message: { type: "string" },
              success: { type: "boolean" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error message" },
          errors: { type: "array", items: { type: "string" } },
        },
      },
    },
    parameters: {
      PostIdPath: {
        name: "postId",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "MongoDB ObjectId of the post",
      },
      CommentIdPath: {
        name: "commentId",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "MongoDB ObjectId of the comment",
      },
      UserIdPath: {
        name: "userId",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "MongoDB ObjectId of the user",
      },
      PageQuery: {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1 },
      },
      LimitQuery: {
        name: "limit",
        in: "query",
        schema: { type: "integer", default: 25 },
      },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    // ─── AUTH ───────────────────────────────────────────────────────────────
    "/auth/register-user": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["first_name", "last_name", "dob", "email", "password"],
                properties: {
                  first_name: { type: "string", example: "John" },
                  last_name: { type: "string", example: "Doe" },
                  dob: { type: "string", format: "date", example: "1995-06-15" },
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", minLength: 6, example: "secret123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User created successfully",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", example: "secret123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful — sets accessToken and refreshToken cookies",
            headers: {
              "Set-Cookie": {
                schema: { type: "string" },
                description: "accessToken and refreshToken cookies (httpOnly, secure)",
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    response: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            accessToken: { type: "string" },
                            refreshToken: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout — clears auth cookies",
        responses: {
          "200": { description: "Logged out successfully" },
        },
      },
    },
    "/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change password",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["old_password", "new_password"],
                properties: {
                  old_password: { type: "string", example: "oldpass123" },
                  new_password: { type: "string", minLength: 6, example: "newpass123" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password changed successfully" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/auth/send-otp": {
      post: {
        tags: ["Auth"],
        summary: "Send email verification OTP",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "OTP sent to the authenticated user's email" },
          "401": { description: "Unauthorized" },
          "404": { description: "User not found" },
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify email OTP",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["emailOtp"],
                properties: {
                  emailOtp: { type: "string", minLength: 6, maxLength: 6, example: "482910" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Email verified successfully" },
          "400": { description: "Invalid or expired OTP" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        description: "Sends a 6-digit reset OTP to the email. Requires the email to be verified first — unverified accounts cannot be recovered.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reset OTP sent to email" },
          "403": { description: "Email not verified — account cannot be recovered" },
          "404": { description: "User not found" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using OTP",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "otp", "new_password"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                  otp: { type: "string", minLength: 6, maxLength: 6, example: "482910" },
                  new_password: { type: "string", minLength: 6, example: "newpass123" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successfully" },
          "400": { description: "Invalid or expired OTP" },
          "404": { description: "User not found" },
        },
      },
    },
    "/auth/profile-picture": {
      patch: {
        tags: ["Auth"],
        summary: "Update profile picture",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["profile_picture"],
                properties: {
                  profile_picture: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Profile picture updated" },
          "400": { description: "File required" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ─── POSTS ──────────────────────────────────────────────────────────────
    "/post": {
      get: {
        tags: ["Posts"],
        summary: "Get all posts (paginated)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "pageNo", in: "query", schema: { type: "integer", default: 1 } },
          { name: "itemPerPage", in: "query", schema: { type: "integer", default: 25 } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "updatedAt"], default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc", "1", "-1"], default: "asc" } },
          { name: "name", in: "query", schema: { type: "string" }, description: "Filter by title keyword" },
          { name: "isMedia", in: "query", schema: { type: "string", enum: ["true", "false"] }, description: "Filter posts that have media" },
        ],
        responses: {
          "200": {
            description: "Paginated list of posts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    response: {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/PaginatedPosts" } },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a post",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", example: "My Post Title" },
                  content: { type: "string", example: "Post body text" },
                  file: { type: "string", format: "binary", description: "Optional media file" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Post created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/post/user/{userId}": {
      get: {
        tags: ["Posts"],
        summary: "Get posts by a specific user",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/UserIdPath" },
          { name: "pageNo", in: "query", schema: { type: "integer", default: 1 } },
          { name: "itemPerPage", in: "query", schema: { type: "integer", default: 25 } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["createdAt", "updatedAt"], default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc", "1", "-1"], default: "asc" } },
          { name: "name", in: "query", schema: { type: "string" } },
          { name: "isMedia", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: {
          "200": {
            description: "Paginated posts for the user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    response: {
                      type: "object",
                      properties: { data: { $ref: "#/components/schemas/PaginatedPosts" } },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/post/{postId}": {
      get: {
        tags: ["Posts"],
        summary: "Get a post by ID",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PostIdPath" }],
        responses: {
          "200": {
            description: "Post object",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    response: {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: { post: { $ref: "#/components/schemas/Post" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Post not found" },
        },
      },
      put: {
        tags: ["Posts"],
        summary: "Edit a post",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PostIdPath" }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  file: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Post edited successfully" },
          "401": { description: "Unauthorized" },
          "404": { description: "Post not found" },
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete a post",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PostIdPath" }],
        responses: {
          "200": { description: "Post deleted" },
          "401": { description: "Unauthorized" },
          "404": { description: "Post not found" },
        },
      },
    },

    // ─── COMMENTS ───────────────────────────────────────────────────────────
    "/post/{postId}/comments": {
      post: {
        tags: ["Comments"],
        summary: "Add a comment to a post",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PostIdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", example: "Nice article!" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Comment added", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["Comments"],
        summary: "Get comments on a post",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/LimitQuery" },
        ],
        responses: {
          "200": { description: "List of comments" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/post/{postId}/comments/{commentId}": {
      patch: {
        tags: ["Comments"],
        summary: "Edit a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/CommentIdPath" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", example: "Updated comment text" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Comment updated" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden — not the comment owner" },
        },
      },
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/CommentIdPath" },
        ],
        responses: {
          "200": { description: "Comment deleted" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/post/{postId}/comments/{commentId}/replies": {
      post: {
        tags: ["Comments"],
        summary: "Reply to a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/CommentIdPath" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", example: "I agree!" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Reply added" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["Comments"],
        summary: "Get replies on a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/CommentIdPath" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/LimitQuery" },
        ],
        responses: {
          "200": { description: "List of replies" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ─── POST REACTIONS ─────────────────────────────────────────────────────
    "/post/{postId}/reactions": {
      post: {
        tags: ["Post Reactions"],
        summary: "Add a reaction to a post",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PostIdPath" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reaction"],
                properties: {
                  reaction: { type: "integer", enum: [1, -1], description: "1 = LIKE, -1 = DISLIKE" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reaction added" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Post Reactions"],
        summary: "Remove your reaction from a post",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/PostIdPath" }],
        responses: {
          "200": { description: "Reaction removed" },
          "401": { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["Post Reactions"],
        summary: "Get all reactions on a post",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/LimitQuery" },
        ],
        responses: {
          "200": { description: "List of reactions" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/post/{postId}/reactions/user/{userId}": {
      get: {
        tags: ["Post Reactions"],
        summary: "Get reactions by a specific user on a post",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/UserIdPath" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/LimitQuery" },
        ],
        responses: {
          "200": { description: "User reactions" },
          "401": { description: "Unauthorized" },
        },
      },
    },

    // ─── COMMENT REACTIONS ───────────────────────────────────────────────────
    "/post/{postId}/comments/{commentId}/reactions": {
      post: {
        tags: ["Comment Reactions"],
        summary: "Add a reaction to a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/CommentIdPath" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reaction"],
                properties: {
                  reaction: { type: "integer", enum: [1, -1], description: "1 = LIKE, -1 = DISLIKE" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Reaction added" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Comment Reactions"],
        summary: "Remove your reaction from a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/CommentIdPath" },
        ],
        responses: {
          "200": { description: "Reaction removed" },
          "401": { description: "Unauthorized" },
        },
      },
      get: {
        tags: ["Comment Reactions"],
        summary: "Get all reactions on a comment",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/PostIdPath" },
          { $ref: "#/components/parameters/CommentIdPath" },
          { $ref: "#/components/parameters/PageQuery" },
          { $ref: "#/components/parameters/LimitQuery" },
        ],
        responses: {
          "200": { description: "List of reactions" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
};

export default swaggerDocument;
