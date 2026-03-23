# API Endpoints

Base URL: `http://localhost:5000`

🔒 = requires `Authorization: Bearer <token>`

## Auth
| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/api/register` | `username, email, firstname, surname, password, age, gender` (`age`/`gender` optional) |
| POST | `/api/login` | `email, password` |

## Users
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET 🔒 | `/api/user/:userId` | Own user only |
| PATCH 🔒 | `/api/user/:userId` | `username, email, firstname, surname, age, gender` (all optional) — own user only |
| DELETE 🔒 | `/api/user/:userId` | Own user only — returns 204 |
| PUT 🔒 | `/api/user/:userId/profile-picture` | Multipart file upload, own user only |

## Campaigns
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST 🔒 | `/api/campaigns` | `title` (required), `description, tags, goal, milestones, city_name` |
| GET 🔒 | `/api/campaigns` | All campaigns |
| GET 🔒 | `/api/campaigns/:campaignId` | Single campaign |
| PATCH 🔒 | `/api/campaigns/:campaignId` | `title, description, tags, goal, milestones, city_name, is_complete, owner_ids` (all optional) — own campaigns only; `owner_ids` must be a non-empty array of user IDs |
| DELETE 🔒 | `/api/campaigns/:campaignId` | Own campaigns only — returns 204 |
| POST 🔒 | `/api/campaigns/:campaignId/images` | `{ imageId }` — own campaigns only |
| GET 🔒 | `/api/campaigns/:campaignId/images` | List image metadata |

## Donations
| Method | Endpoint | Body |
|--------|----------|------|
| POST 🔒 | `/api/donations` | `to_campaign, amount` — `cpr_number` optional, format `DDMMYY-XXXX` e.g. `128497-4628` (stored/updated in `user_cpr`) |

## Images
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST 🔒 | `/api/images` | Multipart file upload — returns image metadata |
| GET 🔒 | `/api/images/:imageId` | Returns raw image bytes |

## Admin
👑 = requires admin role (`role: 'admin'` in JWT)

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET 🔒👑 | `/admin/users` | All users — full data including `cpr_number` and `password_hash` |
| GET 🔒👑 | `/admin/users/:userId` | Single user — full data including `cpr_number` and `password_hash` |

### Roles
- All newly registered users get `role: 'user'` automatically.
- There is no API path to create an admin. The seed admin is added directly in `init.sql`.
- `cpr_number` is stored per user and automatically deleted after 6 months via pg_cron.
