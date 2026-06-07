# MyRunning Score 🏃

India's first CIBIL-inspired running score platform for marathon runners.

**Live:** https://brajaparida.github.io/myrunningscore/

---

## Run locally

```bash
npm install
npm run dev
# open http://localhost:5173/myrunningscore/
```

Try searching: `Abhishek`, `Ashok`, `Amit`, `Komal`, `Arun`

---

## Deploy to GitHub Pages (one-time setup)

1. Push this repo to `github.com/brajaparida/myrunningscore`
2. Go to repo **Settings → Pages**
3. Under **Source** select **GitHub Actions**
4. Push any commit — GitHub Actions builds and deploys automatically

Every subsequent `git push` to `main` auto-deploys in ~2 minutes.

---

## Update the claim form

In `src/pages/Profile.jsx`, replace the `CLAIM_FORM` URL with your Google Form link:

```js
const CLAIM_FORM = 'https://forms.gle/YOUR_FORM_ID'
```

---

## Add more race data

Add records to `src/data/races.json` with this shape:
```json
{ "race":"Race Name", "date":"YYYY-MM-DD", "city":"City",
  "bib":"123", "name":"Runner Name", "time":"1:05:30",
  "secs":3930, "cat":"half", "gender":"M", "age_group":"35-39", "rank":42 }
```

Then `git push` — site rebuilds automatically.

---

## Data sources
- APYK Marathon Patna (2023)
- Bangalore Marathon Festival 2025
- Mile Runners India Bangalore Marathon (2017)
