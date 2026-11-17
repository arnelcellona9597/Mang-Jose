#!/usr/bin/env python3
"""Pre-deploy checks for the Mang Jose static site. Exits non-zero on any problem."""
import json
import os
import re
import sys
import xml.dom.minidom

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
errors = []


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def err(msg):
    errors.append(msg)
    print(f'  FAIL  {msg}')


html = read('index.html')

# 1) in-page anchors resolve, ids are unique
ids = re.findall(r'\bid="([^"]+)"', html)
dups = sorted({i for i in ids if ids.count(i) > 1})
if dups:
    err(f'duplicate ids: {dups}')
for target in sorted(set(re.findall(r'href="#([^"]+)"', html))):
    if target not in ids:
        err(f'anchor #{target} has no matching id')

# 2) every <img> has alt text
for tag in re.findall(r'<img\b[^>]*>', html):
    if ' alt=' not in tag:
        err(f'image without alt: {tag[:80]}')

# 3) JSON-LD parses
for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
    try:
        json.loads(block)
    except ValueError as e:
        err(f'invalid JSON-LD: {e}')

# 4) local files referenced from HTML/CSS exist
refs = set(re.findall(r'(?:src|href|data-full)="(assets/[^"#?]+|[\w.-]+\.(?:php|ico|webmanifest|txt|xml))"', html))
css = read('assets/css/style.css')
refs |= {u for u in re.findall(r'url\("?\.\./([^")]+)"?\)', css)}
refs |= {u for u in re.findall(r"url\('?(assets/[^')]+)'?\)", html)}
for ref in sorted(refs):
    path = ref if ref.startswith(('assets/',)) or '/' not in ref else ref
    if not os.path.exists(os.path.join(ROOT, path)) and not os.path.exists(os.path.join(ROOT, 'assets', path)):
        err(f'missing file referenced: {ref}')

# 5) production domain, no placeholders
for rel in ('index.html', 'robots.txt', 'sitemap.xml', 'contact.php'):
    text = read(rel)
    if 'mangjosefriedchicken' in text:
        err(f'{rel} still contains the old placeholder domain')
    if 'owner@example.com' in text:
        err(f'{rel} still contains the placeholder email')
if '<link rel="canonical" href="https://mangjosecorner.com/">' not in html:
    err('canonical link is not https://mangjosecorner.com/')

# 6) XML / manifest are well formed
try:
    xml.dom.minidom.parseString(read('sitemap.xml'))
    json.loads(read('site.webmanifest'))
except Exception as e:  # noqa: BLE001
    err(f'sitemap/manifest not valid: {e}')

# 7) the live server runs PHP 7.2: block newer-only syntax in contact.php
php = read('contact.php')
for pat, name in [(r'\bstr_contains\(', 'str_contains'), (r'\bstr_starts_with\(', 'str_starts_with'),
                  (r'\bstr_ends_with\(', 'str_ends_with'), (r'\bmatch\s*\(', 'match()'),
                  (r'\?->', 'nullsafe operator'), (r'\bfn\s*\(', 'arrow function'),
                  (r'\bmixed\b', 'mixed type')]:
    if re.search(pat, php):
        err(f'contact.php uses {name}, which PHP 7.2 does not support')

# 8) nothing secret committed
for dirpath, _, files in os.walk(ROOT):
    if any(p in dirpath for p in ('/.git', '/node_modules', '/screenshots')):
        continue
    for name in files:
        if name.endswith(('.php', '.js', '.html', '.css', '.yml', '.json', '.md', '.py')):
            body = open(os.path.join(dirpath, name), encoding='utf-8', errors='ignore').read()
            if re.search(r'(?i)(ftp_?password|smtp_?pass(word)?)\s*[:=]\s*["\'][^"\']{4,}', body):
                err(f'possible hard-coded password in {os.path.relpath(os.path.join(dirpath, name), ROOT)}')

if errors:
    print(f'\n{len(errors)} problem(s) found.')
    sys.exit(1)
print('All site checks passed.')
