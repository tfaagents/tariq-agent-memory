#!/usr/bin/env python3
"""Spot repeated jobs in sessions/ and print PATTERN NOTICES for the agent to offer.

Skill offer:    same slug finished 3+ times in the last 60 days, no .claude/skills/<slug>/,
                not in memory/declined.md.
Schedule offer: same slug started 3+ times at the same hour (±1h), either on the same
                weekday (weekly) or on 3+ different days (daily), no LaunchAgent yet.
Runs in well under a second. Prints nothing when there is nothing to offer.
"""
import datetime as dt
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SESSIONS = os.path.join(ROOT, "sessions")
SKILLS = os.path.join(ROOT, ".claude", "skills")
DECLINED = os.path.join(ROOT, "memory", "declined.md")
LAUNCH = os.path.expanduser("~/Library/LaunchAgents")
WINDOW_DAYS = 60
MIN_REPEATS = 3
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def frontmatter(path):
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read(4000)
    except OSError:
        return {}
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out[k.strip().lower()] = v.strip()
    return out


def parse_time(s):
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(s[:19], fmt)
        except ValueError:
            continue
    return None


def declined():
    try:
        with open(DECLINED, encoding="utf-8") as f:
            return set(re.findall(r"^\s*-\s*(\S+)", f.read(), re.M))
    except OSError:
        return set()


def main():
    if not os.path.isdir(SESSIONS):
        return
    cutoff = dt.datetime.now() - dt.timedelta(days=WINDOW_DAYS)
    runs = defaultdict(list)
    for name in os.listdir(SESSIONS):
        if not name.endswith(".md") or name in ("README.md", "TEMPLATE.md"):
            continue
        fm = frontmatter(os.path.join(SESSIONS, name))
        slug = fm.get("slug", "").strip()
        started = parse_time(fm.get("started", ""))
        if not slug or slug.startswith("short-stable") or not started or started < cutoff:
            continue
        runs[slug].append((started, fm.get("job", ""), fm.get("outcome", "")))

    skip = declined()
    notices = []
    for slug, items in sorted(runs.items()):
        if slug in skip or len(items) < MIN_REPEATS:
            continue
        job = next((j for _, j, _ in items if j), slug)
        has_skill = os.path.isdir(os.path.join(SKILLS, slug))
        if not has_skill:
            notices.append(
                "- Skill: '%s' (slug %s) has been done %d times with no skill. Offer /%s."
                % (job, slug, len(items), slug)
            )
        has_schedule = os.path.exists(os.path.join(LAUNCH, "com.tfa.tariq-agent.%s.plist" % slug))
        if has_schedule:
            continue
        by_hour = defaultdict(list)
        for started, _, _ in items:
            by_hour[started.hour].append(started)
        for hour, starts in by_hour.items():
            near = [s for s in items if abs(s[0].hour - hour) <= 1]
            if len(near) < MIN_REPEATS:
                continue
            weekdays = defaultdict(int)
            for s, _, _ in near:
                weekdays[s.weekday()] += 1
            wd, count = max(weekdays.items(), key=lambda kv: kv[1])
            distinct_days = len({s[0].date() for s in near})
            if count >= MIN_REPEATS:
                notices.append(
                    "- Schedule: '%s' (slug %s) runs around %02d:00 on %ss (%d times). "
                    "Offer a weekly schedule if it needs no login or submit."
                    % (job, slug, hour, DAYS[wd].capitalize(), count)
                )
            elif distinct_days >= MIN_REPEATS:
                notices.append(
                    "- Schedule: '%s' (slug %s) runs around %02d:00 on %d different days. "
                    "Offer a daily schedule if it needs no login or submit."
                    % (job, slug, hour, distinct_days)
                )
            break

    if notices:
        print("PATTERN NOTICE (from sessions/, last %d days). Offer these to Tariq in one line each, then get on with his job:" % WINDOW_DAYS)
        print("\n".join(notices[:4]))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.exit(0)
