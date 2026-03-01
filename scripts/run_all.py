#!/usr/bin/env python3
"""
Full pipeline: scrape -> test -> update README.

This is the single entry point for the entire E2E system.
Every number that ends up in the README was fetched during THIS run.
"""

import subprocess
import sys
import os

# Ensure we're in the repo root
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def run_step(name: str, cmd: list[str]) -> bool:
    print(f"\n{'='*60}")
    print(f"  STEP: {name}")
    print(f"{'='*60}\n")
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print(f"\n  FAILED: {name} (exit code {result.returncode})")
        return False
    print(f"\n  PASSED: {name}")
    return True


def main():
    steps = [
        ("Scrape live data from 5 repos", [sys.executable, "-m", "scraper.seo_scraper"]),
        ("Run E2E tests", [sys.executable, "-m", "pytest", "e2e/", "-v", "--tb=short"]),
        ("Update README with verified numbers", [sys.executable, "-m", "scraper.readme_writer"]),
    ]

    results = {}
    for name, cmd in steps:
        passed = run_step(name, cmd)
        results[name] = passed
        if not passed:
            print(f"\n  Pipeline stopped at: {name}")
            print(f"  Fix the issue and re-run: python3 scripts/run_all.py")
            # Still try to update README to show what we know
            if name != steps[0][0]:
                # Only skip README update if scraper itself failed
                run_step("Update README (partial data)", steps[2][1])
            break

    print(f"\n{'='*60}")
    print("  PIPELINE SUMMARY")
    print(f"{'='*60}")
    for name, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {name}")

    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
