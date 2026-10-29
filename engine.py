"""
Attendance rules - the same logic the browser uses (static/portal.js -> dayRow).
Used for Excel exports so files always match what HR sees on screen.

Codes: P Present, L Late, A Absent, H Half day, E Excused, S Sick leave,
       WH Work from home, WO Weekly off / holiday
"""
import os
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

# All dates and times use Pakistan time, whatever timezone the hosting server is in.
TZ = ZoneInfo(os.environ.get("PORTAL_TZ", "Asia/Karachi"))


def now():
    return datetime.now(TZ).replace(tzinfo=None)


def today():
    return now().date()

CODES = {"P": "Present", "L": "Late", "A": "Absent", "H": "Half day", "E": "Excused",
         "S": "Sick leave", "WH": "Work from home", "WO": "Weekly off / holiday"}
WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def mins(t):
    if not t:
        return None
    return int(t[0:2]) * 60 + int(t[3:5])


def fmt(m):
    if m is None or m == "":
        return ""
    return f"{int(m) // 60}:{int(m) % 60:02d}"


def shift_of(s, st):
    return {"in": s["sin"] or st["d_in"], "out": s["sout"] or st["d_out"],
            "grace": s["grace"] if s["grace"] is not None else st["grace"]}


def is_off(ds, st):
    return datetime.strptime(ds, "%Y-%m-%d").weekday() in st["off"] or ds in st["holidays"]


def day_row(s, ds, times, note, st, today=None):
    """s: staff dict (sid,m,u,name,des,dep,sin,sout,grace,late,hours,ot)
    times: list of 'HH:MM:SS' for that person/day; note: dict or None; st: settings dict."""
    today = today or globals()["today"]().isoformat()
    if ds > today:
        return None
    t = sorted(x[:5] for x in times)
    n = note or {}
    sh = shift_of(s, st)
    cin = n.get("fin") or (t[0] if t else "")
    cout = n.get("fout") or (t[-1] if len(t) > 1 else "")
    off = is_off(ds, st)
    worked = late = early = ot = None
    if cin and cout and mins(cout) > mins(cin):
        worked = mins(cout) - mins(cin)
    if s["late"] and cin and not off:
        l = mins(cin) - mins(sh["in"])
        late = l if l > sh["grace"] else 0
        if cout:
            e = mins(sh["out"]) - mins(cout)
            early = e if e > 0 else 0
    auto = "WO" if off else (("L" if late else "P") if cin else ("" if ds == today else "A"))
    if st.get("short_h") and not off and worked is not None and worked < (mins(sh["out"]) - mins(sh["in"])) / 2:
        auto = "H"
    status = n.get("status") or auto
    if status in ("A", "S", "E", "WH"):
        late = early = None
    if s["ot"] and cout:
        o = (worked or 0) if (off or status == "WO") else mins(cout) - mins(sh["out"])
        ot = o if o >= st["ot_min"] else 0
    return {"ds": ds, "day": WD[datetime.strptime(ds, "%Y-%m-%d").weekday()], "cin": cin, "cout": cout,
            "punches": t, "worked": worked, "hours": worked if s["hours"] else None, "late": late,
            "early": early, "ot": ot, "st": status, "manual": bool(n.get("status")),
            "fixed": bool(n.get("fin") or n.get("fout")), "comment": n.get("comment") or "",
            "shift": sh, "missing_out": bool(cin) and not cout and ds != today}


def month_days(month):
    y, m = map(int, month.split("-"))
    d = date(y, m, 1)
    out = []
    while d.month == m:
        out.append(d.isoformat())
        d += timedelta(days=1)
    return out


def tally(rows):
    t = {k: 0 for k in CODES}
    t.update(late=0, hours=0, ot=0, ot_days=0, work=0)
    for r in rows:
        if not r:
            continue
        if r["st"] in t:
            t[r["st"]] += 1
        t["late"] += r["late"] or 0
        t["hours"] += r["worked"] or 0
        if r["ot"]:
            t["ot"] += r["ot"]
            t["ot_days"] += 1
        if r["st"] and r["st"] != "WO":
            t["work"] += 1
    t["pct"] = round((t["P"] + t["L"] + t["WH"] + t["E"] + t["H"] * 0.5) / t["work"] * 100) if t["work"] else 0
    return t
