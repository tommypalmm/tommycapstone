#!/usr/bin/env python3
"""Docs sanity check for the Capstone repo (standard library only).

The repository is docs-only until Week 9, so the "build" that matters right
now is that the documentation stays well-formed and internally linked. This
script verifies that:

  1. every Markdown file starts with a top-level (`#`) heading, and
  2. every relative Markdown link points at a file that actually exists.

It adds no third-party dependencies and exits non-zero if anything is wrong,
so it is safe to run from the Cloud Agent environment `install` step or by
hand: `python3 .cursor/check-docs.py`.
"""
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def md_files(base):
    for dirpath, _dirs, files in os.walk(base):
        if os.sep + ".git" in dirpath:
            continue
        for name in sorted(files):
            if name.endswith(".md"):
                yield os.path.join(dirpath, name)


def main():
    problems = []
    checked_links = 0
    files = sorted(md_files(REPO))
    print(f"Scanning {len(files)} Markdown files under {REPO}\n")

    for path in files:
        rel = os.path.relpath(path, REPO)
        with open(path, encoding="utf-8") as fh:
            text = fh.read()

        first = next((ln for ln in text.splitlines() if ln.strip()), "")
        if not first.startswith("# "):
            problems.append(f"{rel}: does not start with an H1 heading")

        for target in LINK_RE.findall(text):
            link = target.split("#", 1)[0].strip()
            if not link:
                continue  # pure in-page anchor
            if re.match(r"^[a-z]+://", link) or link.startswith("mailto:"):
                continue  # external link
            if link.startswith("<") and link.endswith(">"):
                continue  # placeholder such as <repo-url>
            checked_links += 1
            resolved = os.path.normpath(os.path.join(os.path.dirname(path), link))
            if not os.path.exists(resolved):
                problems.append(f"{rel}: broken link -> {target}")

        print(f"  ok  {rel}")

    print(f"\nChecked {checked_links} internal links across {len(files)} files.")
    if problems:
        print(f"\nFound {len(problems)} problem(s):")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    print("\nAll docs well-formed and all internal links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
