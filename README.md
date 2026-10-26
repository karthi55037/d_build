# FORM/STUDIO

A Next.js clothing storefront with a MongoDB Atlas catalog, persistent guest carts, order placement, and password-protected product management.

## Local setup

1. Rotate the Atlas database user's password if it has ever been shared, and create a database user with read/write access only to the application's database.
2. Copy `.env.example` to `.env.local`.
3. Set `MONGODB_URI` to the newly rotated Atlas connection string. Keep it server-only; do not add a `NEXT_PUBLIC_` prefix.
4. Set `MONGODB_DB` to the database name (or keep `formstudio`).
5. Set `ADMIN_USERNAME` to the private administrator username.
6. Generate a password hash in a private terminal:

   ```powershell
   npm.cmd run admin:hash
   ```

   Enter a strong password when prompted. Copy the printed `ADMIN_PASSWORD_HASH` value into `.env.local`. The password is not displayed or stored by the script.
7. Generate a session secret:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   Set the output as `SESSION_SECRET`. Use at least 32 random bytes and do not reuse the admin password.
8. Start the app:

   ```powershell
   npm.cmd run dev
   ```

   The first product request seeds the eight existing demo products only when the MongoDB `products` collection is empty. Existing non-empty collections are left unchanged.

## Features

- Product catalog, category filters, search, and product detail pages.
- Guest carts stored in MongoDB and tied to a signed, HTTP-only cookie.
- Order creation validates current product availability, server-side prices, and stock inside a MongoDB transaction. Stock is decremented and the cart cleared atomically.
- Order confirmation displays a reference and item totals without exposing customer delivery details.
- Admin sign-in at `/admin/login` and protected product create, edit, list, and delete operations.
- Admin password hashes use scrypt. Admin and cart cookies are HTTP-only, secure in production, and same-site strict.
- Order placement is implemented, but online payment processing is not. Do not represent an order as paid.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string. Server-only. Never use a localhost URI in production. |
| `MONGODB_DB` | No | Database name; defaults to `formstudio`. |
| `ADMIN_USERNAME` | Yes for admin | Administrator login name. |
| `ADMIN_PASSWORD_HASH` | Yes for admin | Output from `npm.cmd run admin:hash`; do not store a plain password. |
| `SESSION_SECRET` | Yes | Random secret of at least 32 bytes for signed sessions and guest-cart cookies. |

All of these variables belong in the local `.env.local` file or the Vercel project's Environment Variables settings. Never commit `.env.local`, expose secrets through `NEXT_PUBLIC_` variables, paste them into source code, or include them in logs or support requests.

## MongoDB Atlas access

- Use a dedicated database user with only the privileges this app needs on the selected database.
- Use the Atlas TLS-enabled connection string and rotate any password that was exposed.
- Configure Atlas Network Access to allow Vercel's static outbound IP or secure egress addresses, if available for the Vercel plan/project. Avoid allowing all IPs (`0.0.0.0/0`) for a production database. If the deployment has no stable egress range, configure an appropriate Vercel static egress option before opening Atlas access.
- Keep the connection URI in server environment variables only.

## Vercel deployment

1. Import/link this `style-store` project in Vercel.
2. In **Project Settings → Environment Variables**, configure `MONGODB_URI`, `MONGODB_DB`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `SESSION_SECRET` for Production (and Preview only if those deployments should access the database).
3. Generate the hash and session secret locally as described above, then enter them directly in Vercel. Do not commit or share them.
4. Set the Atlas Network Access rule for the deployment's secure egress addresses.
5. Deploy only after Vercel has the required environment and Atlas connectivity is ready. Redeploy after changing environment variables.

## Validation

```powershell
npm.cmd run lint
npm.cmd run build
```

Catalog, cart, and checkout requests need a reachable MongoDB database at runtime. No database URI is committed to this project.
