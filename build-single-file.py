#!/usr/bin/env python3
"""Builds Telegram-Together-Prototype.html: index.html + CSS + JS + every asset inlined as data URIs."""
import base64, mimetypes, re, pathlib

root = pathlib.Path(__file__).parent
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("video/webm", ".webm")

def data_uri(rel):
    path = root / rel
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode())

def inline_assets(text):
    return re.sub(r"assets/[A-Za-z0-9_./-]+", lambda m: data_uri(m.group(0)), text)

html = (root / "index.html").read_text(encoding="utf8")
css = (root / "css/styles.css").read_text(encoding="utf8")
js = (root / "js/app.js").read_text(encoding="utf8")
html = re.sub(r'<link[^>]*href="css/styles.css"[^>]*>', lambda m: "<style>\n" + inline_assets(css) + "\n</style>", html)
html = re.sub(r'<script[^>]*src="js/app.js"[^>]*></script>', lambda m: "<script>\n" + inline_assets(js).replace("</script>", "<\\/script>") + "\n</script>", html)
html = inline_assets(html)
(root / "Telegram-Together-Prototype.html").write_text(html, encoding="utf8")
print("Wrote Telegram-Together-Prototype.html (%.1f MB)" % (len(html.encode("utf8")) / 1e6))
