# AI Automation Studio · website

Static site: plain HTML, CSS and JavaScript. No build step, no dependencies.

```
index.html            all sections and English copy
assets/site.css       design system and layout
assets/site.js        scroll video, AI CORE network, demos, scenarios, form
assets/i18n.js        Russian copy + dynamic content in both languages
assets/config.js      contacts and form endpoint (fill in later)
assets/hero-*.{mp4,jpg}  hero video, poster, ending, mobile still
```

## Live

- Main: https://ai-studio.website.yandexcloud.net/ (Yandex Object Storage, bucket `ai-studio`)
- Mirror: https://arinamlva.github.io/ai-automation-studio/ (canonical points to the main address)

Redeploy to Yandex: upload changed files with `yc storage s3 cp FILE s3://ai-studio/FILE --content-type TYPE`.

## Publish on GitHub Pages

1. Create a repository and upload the **contents** of this folder (so `index.html` is at the repo root, `.nojekyll` included).
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. After the first deploy, open `index.html` and replace the three `DEPLOY STEP` values (`canonical`, `og:url`, `og:image`) with the live absolute URL, e.g. `https://USER.github.io/REPO/` and `https://USER.github.io/REPO/assets/og.jpg`.

The hero video is loaded as a Blob, so scroll scrubbing works on GitHub Pages and any static host.

## Fill in later (`assets/config.js`)

- `contacts.email`, `contacts.telegram`, `contacts.phone`: shown under the form when filled, hidden when empty.
- `form.endpoint`: a webhook URL (n8n, Make, Zapier, Cloudflare Worker, CRM). Each request is POSTed as JSON:
  `{ name, company, contact, topic, task, lang, page, sentAt }`.
  While empty, the form runs in demo mode: it shows "REQUEST RECEIVED" and sends nothing.
  Never put a Telegram bot token in this file (it is public). Point the endpoint at a webhook that forwards to Telegram.

## Rename the agency

Search and replace `AI AUTOMATION STUDIO` / `AI Automation Studio` in `index.html` (title, nav, footer, schema).

## Languages

English is the default. `?lang=ru` opens Russian; the EN/RU toggle remembers the choice.
