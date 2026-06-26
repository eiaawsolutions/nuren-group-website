# Investor Announcements — Go-Live Runbook

The page `/investors/announcements` is built and reads its content live from the
**Sanity** CMS (project `nurengroup-cms`, ID `t0u4019v`). The finance team publishes
announcements (including the PDF) from a Sanity Studio dashboard — no developer and no
website redeploy per announcement.

Until the steps below are done, the page renders a graceful **"view on NSX"** fallback
(verified working). Nothing is broken in the meantime.

---

## Status

| Piece | State |
|---|---|
| Website page + route + table/cards/filters | ✅ Done, built, prerendered |
| Live fetch from Sanity + cache + NSX fallback | ✅ Done (`src/data/announcements.ts`) |
| CSP allows Sanity fetch (`server.js`) | ✅ Done |
| Sanity Studio (schema + config) | ✅ Scaffolded & builds (`c:\laragon\www\nuren-studio`) |
| Correct project ID wired (`t0u4019v`) | ✅ Done (was misread as `t0u4o19v`; fixed) |
| Sanity **`production` dataset** | ✅ Exists |
| Dataset public read access | ✅ Public (live query returns HTTP 200) |
| CORS origins allowlisted | ✅ Added: `www.nurengroup.com`, `nurengroup.com`, `localhost:3000` (+ `localhost:3333`) |
| Studio deployed for finance | ✅ Live → **https://nurengroup-cms.sanity.studio** |
| **Finance invited** | ⛔ **Pending — need their emails** (only remaining step) |
| Website PR merged → Railway deploy | ⛔ Pending your merge of PR #2 |
| Railway build var (optional) | ⛔ Optional — code already defaults to the real IDs |

> **Status: the CMS is fully live.** The only things left are inviting finance
> (needs their email addresses) and merging the website PR so the public page goes
> live on nurengroup.com. Until the PR is merged, the page exists in the build but
> isn't on production; once merged, it shows the "No announcements" empty state
> until finance publishes the first one.

---

## Go-live steps (do once)

### 1. Create the `production` dataset (currently missing)
Either in the UI — https://www.sanity.io/manage/project/t0u4019v → **Datasets** → **Add dataset**
→ name `production` → **visibility: Public** — or via CLI:
```bash
cd c:/laragon/www/nuren-studio
npx sanity dataset create production --visibility public
```
> The website reads without a token, so the dataset **must be Public**.

### 2. Add CORS origins
https://www.sanity.io/manage/project/t0u4019v → **API** → **CORS origins** → **Add** each,
**Allow credentials = OFF**:
- `https://www.nurengroup.com`
- `https://nurengroup.com`
- `http://localhost:3000`  (local website dev)
- `http://localhost:3333`  (local Studio — usually auto-added)

### 3. Deploy the Studio
```bash
cd c:/laragon/www/nuren-studio
npm install   # first time only
npm run deploy
```
→ live at **https://nurengroup-cms.sanity.studio**

### 4. Invite finance
https://www.sanity.io/manage/project/t0u4019v → **Members** → **Invite** finance emails,
role **Editor**.

### 5. Deploy the website
Commit + push the website repo so Railway picks up the new page, route, CSP, sitemap.
(The real projectId/dataset are already hard-defaulted in code, so no env var is required.
 To override later — e.g. a staging dataset — set `VITE_SANITY_PROJECT_ID` /
 `VITE_SANITY_DATASET` as Railway **build** variables.)

---

## Acceptance test
1. Finance opens https://nurengroup-cms.sanity.studio, signs in.
2. **Announcements → new** → fill headline, date, type, price-sensitive, upload a PDF → **Publish**.
3. Within ~1 min, https://www.nurengroup.com/investors/announcements shows the new row with a
   working PDF link — **no developer, no redeploy**.

---

## Troubleshooting
- **Page shows "unable to load … view on NSX":** dataset missing/not public (step 1), or the
  site origin isn't in CORS (step 2). Check the browser Network tab — a 404 = dataset; a CORS
  error = step 2.
- **CSP blocks the request** (`Refused to connect … Content Security Policy`): confirm
  `server.js` `connectSrc` includes `*.apicdn.sanity.io` (it does as of this change) and the
  site was redeployed.
- **New announcement not appearing:** the APICDN is cached ~seconds; hard-refresh. Confirm the
  document was **Published**, not just saved as a draft.

## Key files
- Website: `src/data/announcements.ts`, `src/App.tsx` (`InvestorAnnouncementsPage`),
  `server.js` (CSP), `scripts/prerender.mjs`, `public/sitemap.xml`.
- Studio: `c:\laragon\www\nuren-studio\` (`sanity.config.ts`, `sanity.cli.ts`,
  `schemaTypes/announcement.ts`, `README.md`).
