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

## Live site and deployment

The site is live at https://mangjosecorner.com (cPanel hosting, PHP 7.2, LiteSpeed).

Every push to `main` runs `.github/workflows/deploy.yml`:

1. **Checks:** PHP and JavaScript syntax, in-page links, image alt text, structured data, domain/email placeholders and PHP 7.2 compatibility (`.github/scripts/check_site.py`).
2. **Deploy:** uploads the site to the server over FTPS. Only changed files are sent.
3. **Smoke test:** confirms the home page, stylesheet and `contact.php` respond on the live domain.

Pull requests are checked but never deployed. A manual run (Actions > Check and deploy > Run workflow) can be a **dry run** that uploads nothing.

### One-time setup (GitHub > Settings > Secrets and variables > Actions)

| Name | Type | Value |
|---|---|---|
| `FTP_SERVER` | Secret | `cpanel11wh.jpt1.cloud.z.com` (the host the FTPS certificate is issued for) |
| `FTP_USERNAME` | Secret | the cPanel FTP account name |
| `FTP_PASSWORD` | Secret | that account's password |
| `FTP_DIR` | Variable or secret | folder to upload into, e.g. `public_html/`. Set to `public_html/` because this FTP account starts in the cPanel home folder. |

Never commit passwords to the repository. The form emails are sent with PHP `mail()` from `sales@mangjosecorner.com`, so no mail password is stored anywhere in the code.

### Local preview

```bash
php -S localhost:8000
```

## Branching

- `main`: production
- `develop`: integration
- `feature/*`: new work, merged into `develop`, then `develop` into `main`

## Analytics

Google Tag Manager (container `GTM-TJ6JD3X4`) is installed in `index.html`. Configure GA4 and any other tags inside the Tag Manager dashboard, not in the code.
