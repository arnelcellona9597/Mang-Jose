# Mang Jose Fried Chicken Corner

A one-page website for Mang Jose Fried Chicken Corner in Davao City, built with HTML, CSS and vanilla JavaScript, plus a PHP contact form handler.

## Structure

```
index.html          Single page (hero slider, about, menu, gallery, branches, contact)
contact.php         Contact form handler (PHP mail())
assets/css/         Styles
assets/js/          Interactions (slider, 3D tilt, parallax, lightbox, form)
assets/img/         Optimized images, logo, favicons, OG image
robots.txt          Crawler rules
sitemap.xml         Sitemap
site.webmanifest    Web app manifest
favicon.ico
```

## Run locally

```bash
php -S localhost:8000
```

Then open http://localhost:8000.

## Before going live

1. In `contact.php`, set `MAIL_TO` (the inbox that receives messages) and `MAIL_FROM` (an address on your domain).
2. Replace `https://www.mangjosefriedchicken.com/` with the real domain in `index.html`, `robots.txt` and `sitemap.xml`.
3. The host must support PHP `mail()`, or swap in SMTP.

## Branching

- `main`: production
- `develop`: integration
- `feature/*`: new work, merged into `develop`, then `develop` into `main`
