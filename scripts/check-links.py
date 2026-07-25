#!/usr/bin/env python3
"""Check local website references and optionally verify external links.

Run from the project root:
    python scripts/check-links.py
    python scripts/check-links.py --strict-external
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_PREFIX = "https://freemil80.github.io/freemil_/"
LOCAL_DYNAMIC_REFERENCES = {
    "hamburger.png",
    "footer.png",
    "Theophilus.png",
    "sw.js",
}
SKIP_EXTERNAL_PREFIXES = (
    "https://formsubmit.co/",
)


class ReferenceCollector(HTMLParser):
    def __init__(self, source: Path) -> None:
        super().__init__()
        self.source = source
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name in {"href", "src", "action"} and value:
                self.references.append((value, f"{self.source.name}:{tag}[{name}]") )


def is_external(reference: str) -> bool:
    parsed = urllib.parse.urlparse(reference)
    return parsed.scheme in {"http", "https"} and not reference.startswith(SITE_PREFIX)


def local_path_from_reference(reference: str) -> Path | None:
    reference = html.unescape(reference.strip())
    parsed = urllib.parse.urlparse(reference)
    path = urllib.parse.unquote(parsed.path)

    if reference.startswith(SITE_PREFIX):
        path = path.removeprefix("/freemil_").lstrip("/")
    elif path.startswith("/"):
        path = path.lstrip("/")

    if not path:
        path = "index.html"

    candidate = (ROOT / path).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return candidate


def check_local(reference: str, source: str, errors: list[str]) -> None:
    if reference.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return
    if is_external(reference):
        return

    path = local_path_from_reference(reference)
    if path is None:
        errors.append(f"{source}: unsafe local reference {reference}")
    elif not path.exists():
        errors.append(f"{source}: missing {reference}")


def collect_references() -> list[tuple[str, str]]:
    references: list[tuple[str, str]] = []

    for page in ROOT.glob("*.html"):
        collector = ReferenceCollector(page)
        collector.feed(page.read_text(encoding="utf-8"))
        references.extend(collector.references)

    for stylesheet in ROOT.glob("*.css"):
        text = stylesheet.read_text(encoding="utf-8")
        for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", text):
            references.append((match.group(2), f"{stylesheet.name}:url"))

    manifest = ROOT / "site.webmanifest"
    if manifest.exists():
        data = json.loads(manifest.read_text(encoding="utf-8"))
        for icon in data.get("icons", []):
            if icon.get("src"):
                references.append((icon["src"], "site.webmanifest:icon"))

    for item in LOCAL_DYNAMIC_REFERENCES:
        references.append((item, f"dynamic-reference:{item}"))
    for locale in (ROOT / "locales").glob("*.js"):
        references.append((f"locales/{locale.name}", "dynamic-reference:locale"))

    return references


def check_external_url(url: str) -> str | None:
    if url.startswith(SKIP_EXTERNAL_PREFIXES):
        return None

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "PortfolioLinkChecker/1.0"},
        method="HEAD",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            if response.status >= 400:
                return f"HTTP {response.status}"
            return None
    except urllib.error.HTTPError as error:
        if error.code in {403, 405}:
            # Some social and PDF hosts reject HEAD; try a lightweight GET.
            try:
                request = urllib.request.Request(
                    url,
                    headers={"User-Agent": "PortfolioLinkChecker/1.0"},
                    method="GET",
                )
                with urllib.request.urlopen(request, timeout=12) as response:
                    if response.status >= 400:
                        return f"HTTP {response.status}"
                    return None
            except Exception as retry_error:  # noqa: BLE001
                return str(retry_error)
        return f"HTTP {error.code}"
    except Exception as error:  # noqa: BLE001
        return str(error)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict-external",
        action="store_true",
        help="Fail if an external URL cannot be verified.",
    )
    args = parser.parse_args()

    errors: list[str] = []
    warnings: list[str] = []
    external_urls: dict[str, list[str]] = {}

    for reference, source in collect_references():
        if is_external(reference):
            external_urls.setdefault(reference, []).append(source)
        else:
            check_local(reference, source, errors)

    for url, sources in sorted(external_urls.items()):
        problem = check_external_url(url)
        if problem:
            warnings.append(f"{url} ({problem}) referenced by {', '.join(sources)}")

    if errors:
        print("Local reference errors:")
        for error in sorted(set(errors)):
            print(f"- {error}")

    if warnings:
        print("External reference warnings:")
        for warning in warnings:
            print(f"- {warning}")

    if not errors and not warnings:
        print("All local and external references passed.")
    elif not errors:
        print(f"All local references passed; {len(warnings)} external warning(s).")

    if errors or (args.strict_external and warnings):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
