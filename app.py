"""
RapidEx Attendance Portal
- Reads punches from ZKTeco MB20 machines (pyzk) on a schedule and on demand
- Stores everything in SQLite (rapidex_attendance.db)
- Serves the HR portal (templates/portal.html + static/portal.js) and a small JSON API
- Excel exports in the RapidEx HR sheet layout
"""
import io
import json
import os
import sqlite3
import threading
import time
from datetime import date, datetime, timedelta
from functools import wraps

from flask import (Flask, abort, flash, g, jsonify, redirect, render_template, request,
                   send_file, session, url_for)
from werkzeug.security import check_password_hash, generate_password_hash

import engine
import exports

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get("PORTAL_DATA", os.path.join(BASE, "data"))
os.makedirs(DATA, exist_ok=True)
DB_PATH = os.path.join(DATA, "rapidex_attendance.db")
LOGO_PATH = os.path.join(DATA, "logo")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024


def _secret():
    p = os.path.join(DATA, ".secret_key")
    if not os.path.exists(p):
        with open(p, "w") as f:
            f.write(os.urandom(32).hex())
    return open(p).read().strip()


app.secret_key = _secret()
app.permanent_session_lifetime = timedelta(days=14)
sync_lock = threading.Lock()

DEFAULTS = {"sync_hours": 3, "auto": True, "d_in": "12:00", "d_out": "21:00", "grace": 15, "ot_min": 30,
            "off": [6], "holidays": [], "short_h": False, "company": "RapidEx", "last_auto_sync": 0}


# ======================================================================= database
def connect():
    c = sqlite3.connect(DB_PATH, timeout=30)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL")
    return c


def db():
    if "db" not in g:
        g.db = connect()
    return g.db


@app.teardown_appcontext
def _close(_):
    d = g.pop("db", None)
    if d is not None:
        d.close()


def init_db():
    c = connect()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS machines(
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, ip TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 4370, comm_key INTEGER NOT NULL DEFAULT 0, udp INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1, new_track INTEGER NOT NULL DEFAULT 0,
      last_sync TEXT, last_ok INTEGER, last_msg TEXT, serial TEXT);
    CREATE TABLE IF NOT EXISTS staff(
      id INTEGER PRIMARY KEY AUTOINCREMENT, machine_id INTEGER NOT NULL, user_id TEXT NOT NULL,
      name TEXT DEFAULT '', designation TEXT DEFAULT '', department TEXT DEFAULT '',
      shift_in TEXT DEFAULT '', shift_out TEXT DEFAULT '', grace INTEGER,
      track_late INTEGER NOT NULL DEFAULT 1, track_hours INTEGER NOT NULL DEFAULT 1,
      ot INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, tracked INTEGER NOT NULL DEFAULT 0,
      UNIQUE(machine_id, user_id));
    CREATE TABLE IF NOT EXISTS punches(
      machine_id INTEGER NOT NULL, user_id TEXT NOT NULL, ts TEXT NOT NULL,
      PRIMARY KEY(machine_id, user_id, ts));
    CREATE INDEX IF NOT EXISTS ix_p_ts ON punches(ts);
    CREATE TABLE IF NOT EXISTS notes(
      machine_id INTEGER NOT NULL, user_id TEXT NOT NULL, day TEXT NOT NULL,
      status TEXT DEFAULT '', fin TEXT DEFAULT '', fout TEXT DEFAULT '', comment TEXT DEFAULT '',
      by_user TEXT, at TEXT, PRIMARY KEY(machine_id, user_id, day));
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, pw TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin');
    CREATE TABLE IF NOT EXISTS sync_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT, machine_id INTEGER, at TEXT, ok INTEGER, new INTEGER, msg TEXT);
    """)
    c.commit()
    c.close()


def settings(conn=None):
    c = conn or db()
    st = dict(DEFAULTS)
    for r in c.execute("SELECT key,value FROM settings"):
        st[r["key"]] = json.loads(r["value"])
    return st


def save_setting(k, v, conn=None):
    c = conn or db()
    c.execute("INSERT OR REPLACE INTO settings(key,value) VALUES(?,?)", (k, json.dumps(v)))


def staff_dict(r):
    return {"sid": r["id"], "m": r["machine_id"], "u": r["user_id"], "name": r["name"] or f"ID {r['user_id']}",
            "des": r["designation"] or "", "dep": r["department"] or "", "sin": r["shift_in"] or "",
            "sout": r["shift_out"] or "", "grace": r["grace"], "late": r["track_late"], "hours": r["track_hours"],
            "ot": r["ot"], "active": r["active"], "track": r["tracked"]}


def all_staff(conn=None):
    return [staff_dict(r) for r in (conn or db()).execute("SELECT * FROM staff ORDER BY machine_id, CAST(user_id AS INTEGER), user_id")]


def load_range(d_from, d_to, conn=None):
    c = conn or db()
    punches, notes = {}, {}
    for r in c.execute("SELECT machine_id,user_id,ts FROM punches WHERE ts BETWEEN ? AND ? ORDER BY ts",
                       (d_from + " 00:00:00", d_to + " 23:59:59")):
        punches.setdefault(f"{r['machine_id']}|{r['user_id']}|{r['ts'][:10]}", []).append(r["ts"][11:19])
    for r in c.execute("SELECT * FROM notes WHERE day BETWEEN ? AND ?", (d_from, d_to)):
        notes[f"{r['machine_id']}|{r['user_id']}|{r['day']}"] = {
            "status": r["status"] or "", "fin": r["fin"] or "", "fout": r["fout"] or "", "comment": r["comment"] or ""}
    return punches, notes


# ======================================================================= auth
def login_required(f):
    @wraps(f)
    def w(*a, **k):
        if not session.get("user"):
            if request.path.startswith("/api/"):
                return jsonify(error="Signed out. Reload the page and sign in."), 401
            return redirect(url_for("login", next=request.path))
        return f(*a, **k)
    return w


@app.route("/login", methods=["GET", "POST"])
def login():
    first = db().execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
    if request.method == "POST":
        u, p = request.form.get("username", "").strip(), request.form.get("password", "")
        if first:
            if len(u) < 3 or len(p) < 8 or p != request.form.get("password2"):
                flash("Use a username of 3+ characters and a password of 8+ characters, typed the same twice.")
            else:
                db().execute("INSERT INTO users(username,pw) VALUES(?,?)", (u, generate_password_hash(p)))
                db().commit()
                session.permanent, session["user"] = True, u
                return redirect("/")
        else:
            time.sleep(0.4)
            row = db().execute("SELECT * FROM users WHERE username=?", (u,)).fetchone()
            if row and check_password_hash(row["pw"], p):
                session.permanent, session["user"] = True, u
                nxt = request.args.get("next", "/")
                return redirect(nxt if nxt.startswith("/") else "/")
            flash("Wrong username or password.")
    return render_template("login.html", first=first, has_logo=os.path.exists(LOGO_PATH))


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ======================================================================= machine sync
def make_zk(m):
    from zk import ZK
    return ZK(m["ip"], port=int(m["port"]), timeout=15, password=int(m["comm_key"] or 0),
              force_udp=bool(m["udp"]), ommit_ping=True)


def sync_machine(m):
    c = connect()
    conn, new, ok = None, 0, False
    try:
        conn = make_zk(m).connect()
        conn.disable_device()
        users = conn.get_users() or []
        recs = conn.get_attendance() or []
        try:
            serial = conn.get_serialnumber()
        except Exception:
            serial = None
        conn.enable_device()
        for u in users:
            c.execute("""INSERT INTO staff(machine_id,user_id,name,tracked) VALUES(?,?,?,?)
                         ON CONFLICT(machine_id,user_id) DO UPDATE SET
                         name=CASE WHEN staff.name IS NULL OR staff.name='' THEN excluded.name ELSE staff.name END""",
                      (m["id"], str(u.user_id).strip(), (u.name or "").strip(), m["new_track"]))
        before = c.total_changes
        for r in recs:
            c.execute("INSERT OR IGNORE INTO punches(machine_id,user_id,ts) VALUES(?,?,?)",
                      (m["id"], str(r.user_id).strip(), r.timestamp.strftime("%Y-%m-%d %H:%M:%S")))
        new = c.total_changes - before
        c.execute("""INSERT OR IGNORE INTO staff(machine_id,user_id,name,tracked)
                     SELECT DISTINCT machine_id,user_id,'',? FROM punches WHERE machine_id=?""", (m["new_track"], m["id"]))
        msg, ok = f"{new} new punches", True
        if serial:
            c.execute("UPDATE machines SET serial=? WHERE id=?", (serial, m["id"]))
    except Exception as e:  # noqa
        msg = f"Could not connect: {e}"
    finally:
        if conn:
            try:
                conn.enable_device()
                conn.disconnect()
            except Exception:
                pass
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("UPDATE machines SET last_sync=?, last_ok=?, last_msg=? WHERE id=?", (now, int(ok), msg, m["id"]))
    c.execute("INSERT INTO sync_log(machine_id,at,ok,new,msg) VALUES(?,?,?,?,?)", (m["id"], now, int(ok), new, msg))
    c.commit()
    c.close()
    return {"id": m["id"], "name": m["name"], "ok": ok, "new": new, "msg": msg}


def sync_all(only=None):
    with sync_lock:
        c = connect()
        q = "SELECT * FROM machines WHERE enabled=1" + (" AND id=?" if only else "")
        ms = c.execute(q, (only,) if only else ()).fetchall()
        c.close()
        return [sync_machine(dict(m)) for m in ms]


def scheduler():
    while True:
        try:
            c = connect()
            st = settings(c)
            if st["auto"] and time.time() - float(st["last_auto_sync"]) >= float(st["sync_hours"]) * 3600:
                save_setting("last_auto_sync", time.time(), c)
                c.commit()
                c.close()
                sync_all()
            else:
                c.close()
        except Exception as e:
            print("scheduler:", e)
        time.sleep(30)


# ======================================================================= pages
@app.route("/")
@login_required
def portal():
    return render_template("portal.html", user=session["user"], has_logo=os.path.exists(LOGO_PATH),
                           v=int(os.path.getmtime(os.path.join(BASE, "static", "portal.js"))))


@app.route("/logo")
def logo():
    if not os.path.exists(LOGO_PATH):
        abort(404)
    mt = open(LOGO_PATH + ".type").read() if os.path.exists(LOGO_PATH + ".type") else "image/png"
    return send_file(LOGO_PATH, mimetype=mt, max_age=300)


# ======================================================================= API
def machine_dict(r):
    return {"id": r["id"], "name": r["name"], "ip": r["ip"], "port": r["port"], "key": r["comm_key"],
            "udp": r["udp"], "enabled": r["enabled"], "newTrack": r["new_track"], "serial": r["serial"],
            "ok": None if r["last_ok"] is None else bool(r["last_ok"]), "lastSync": r["last_sync"], "msg": r["last_msg"]}


@app.route("/api/bootstrap")
@login_required
def api_bootstrap():
    st = settings()
    ms = [machine_dict(r) for r in db().execute("SELECT * FROM machines ORDER BY id")]
    last = max([m["lastSync"] for m in ms if m["lastSync"]] or [None]) if ms else None
    nxt = float(st["last_auto_sync"]) + float(st["sync_hours"]) * 3600 if st["last_auto_sync"] else None
    return jsonify(settings={k: st[k] for k in ("sync_hours", "auto", "d_in", "d_out", "grace", "ot_min", "off",
                                                 "holidays", "short_h", "company")},
                   machines=ms, staff=all_staff(), today=date.today().isoformat(), user=session["user"],
                   lastSync=last, nextSync=datetime.fromtimestamp(nxt).strftime("%Y-%m-%d %H:%M:%S") if nxt else None)


@app.route("/api/range")
@login_required
def api_range():
    p, n = load_range(request.args["from"], request.args["to"])
    return jsonify(punches=p, notes=n)


@app.route("/api/note", methods=["POST"])
@login_required
def api_note():
    f = request.get_json(force=True)
    vals = {k: (f.get(k) or "").strip() for k in ("status", "fin", "fout", "comment")}
    if vals["status"] and vals["status"] not in engine.CODES:
        return jsonify(error="Unknown status"), 400
    if any(vals.values()):
        db().execute("""INSERT OR REPLACE INTO notes(machine_id,user_id,day,status,fin,fout,comment,by_user,at)
                        VALUES(?,?,?,?,?,?,?,?,?)""", (f["m"], f["u"], f["day"], vals["status"], vals["fin"], vals["fout"],
                                                        vals["comment"], session["user"], datetime.now().isoformat(timespec="seconds")))
    else:
        db().execute("DELETE FROM notes WHERE machine_id=? AND user_id=? AND day=?", (f["m"], f["u"], f["day"]))
    db().commit()
    return jsonify(ok=True)


STAFF_COLS = {"name": "name", "des": "designation", "dep": "department", "sin": "shift_in", "sout": "shift_out",
              "grace": "grace", "late": "track_late", "hours": "track_hours", "ot": "ot", "active": "active", "track": "tracked"}


def _update_staff(ids, fields):
    sets, params = [], []
    for k, v in fields.items():
        if k in STAFF_COLS:
            sets.append(f"{STAFF_COLS[k]}=?")
            params.append(v)
    if sets and ids:
        db().execute(f"UPDATE staff SET {', '.join(sets)} WHERE id IN ({','.join('?' * len(ids))})", params + list(ids))
        db().commit()


@app.route("/api/staff/<int:sid>", methods=["POST"])
@login_required
def api_staff(sid):
    _update_staff([sid], request.get_json(force=True))
    return jsonify(ok=True)


@app.route("/api/staff/bulk", methods=["POST"])
@login_required
def api_staff_bulk():
    f = request.get_json(force=True)
    _update_staff([int(i) for i in f.get("ids", [])], f.get("set", {}))
    return jsonify(ok=True)


@app.route("/api/machines", methods=["POST"])
@login_required
def api_machine_save():
    f = request.get_json(force=True)
    if not f.get("name") or not f.get("ip"):
        return jsonify(error="Enter an office name and IP address."), 400
    vals = (f["name"].strip(), f["ip"].strip(), int(f.get("port") or 4370), int(f.get("key") or 0),
            int(bool(f.get("udp"))), int(bool(f.get("newTrack"))), int(f.get("enabled", 1)))
    if f.get("id"):
        db().execute("UPDATE machines SET name=?,ip=?,port=?,comm_key=?,udp=?,new_track=?,enabled=? WHERE id=?", vals + (f["id"],))
    else:
        db().execute("INSERT INTO machines(name,ip,port,comm_key,udp,new_track,enabled) VALUES(?,?,?,?,?,?,?)", vals)
    db().commit()
    return jsonify(ok=True)


@app.route("/api/machines/<int:mid>/test", methods=["POST"])
@login_required
def api_machine_test(mid):
    m = db().execute("SELECT * FROM machines WHERE id=?", (mid,)).fetchone()
    try:
        c = make_zk(dict(m)).connect()
        info = []
        for lab, fn in (("Model", "get_device_name"), ("Serial", "get_serialnumber"), ("Machine time", "get_time")):
            try:
                info.append(f"{lab} {getattr(c, fn)()}")
            except Exception:
                pass
        n = len(c.get_users() or [])
        c.disconnect()
        return jsonify(ok=True, msg=f"{m['name']} connected · " + " · ".join(info) + f" · {n} people enrolled")
    except Exception as e:
        return jsonify(ok=False, msg=f"{m['name']}: could not connect ({e}). Check the IP, that the branch router forwards port {m['port']}, and the Comm Key.")


@app.route("/api/machines/<int:mid>/tracking", methods=["POST"])
@login_required
def api_tracking(mid):
    f = request.get_json(force=True)
    db().execute("UPDATE machines SET new_track=? WHERE id=?", (int(bool(f.get("newTrack"))), mid))
    for sid, on in (f.get("track") or {}).items():
        db().execute("UPDATE staff SET tracked=? WHERE id=? AND machine_id=?", (int(bool(on)), int(sid), mid))
    db().commit()
    return jsonify(ok=True)


@app.route("/api/sync", methods=["POST"])
@login_required
def api_sync():
    f = request.get_json(silent=True) or {}
    return jsonify(results=sync_all(f.get("id")))


@app.route("/api/raw")
@login_required
def api_raw():
    d = request.args["d"]
    rows = db().execute("SELECT machine_id,user_id,ts FROM punches WHERE ts BETWEEN ? AND ? ORDER BY ts",
                        (d + " 00:00:00", d + " 23:59:59")).fetchall()
    return jsonify(punches=[{"m": r["machine_id"], "u": r["user_id"], "t": r["ts"][11:]} for r in rows])


@app.route("/api/settings", methods=["POST"])
@login_required
def api_settings():
    f = request.get_json(force=True)
    allowed = {"sync_hours": float, "auto": bool, "d_in": str, "d_out": str, "grace": int, "ot_min": int,
               "off": list, "holidays": list, "short_h": bool, "company": str}
    for k, typ in allowed.items():
        if k in f:
            save_setting(k, typ(f[k]))
    db().commit()
    return jsonify(ok=True)


@app.route("/api/password", methods=["POST"])
@login_required
def api_password():
    f = request.get_json(force=True)
    row = db().execute("SELECT * FROM users WHERE username=?", (session["user"],)).fetchone()
    if not row or not check_password_hash(row["pw"], f.get("current", "")):
        return jsonify(error="Current password is wrong."), 400
    if len(f.get("new", "")) < 8:
        return jsonify(error="New password must be at least 8 characters."), 400
    db().execute("UPDATE users SET pw=? WHERE id=?", (generate_password_hash(f["new"]), row["id"]))
    db().commit()
    return jsonify(ok=True)


@app.route("/api/users", methods=["GET", "POST"])
@login_required
def api_users():
    if request.method == "POST":
        f = request.get_json(force=True)
        if f.get("delete"):
            if f["delete"] == session["user"]:
                return jsonify(error="You can't remove your own login."), 400
            db().execute("DELETE FROM users WHERE username=?", (f["delete"],))
        else:
            u, p = (f.get("username") or "").strip(), f.get("password") or ""
            if len(u) < 3 or len(p) < 8:
                return jsonify(error="Username 3+ characters, password 8+ characters."), 400
            try:
                db().execute("INSERT INTO users(username,pw) VALUES(?,?)", (u, generate_password_hash(p)))
            except sqlite3.IntegrityError:
                return jsonify(error="That username already exists."), 400
        db().commit()
    return jsonify(users=[r["username"] for r in db().execute("SELECT username FROM users ORDER BY id")])


@app.route("/api/logo", methods=["POST"])
@login_required
def api_logo():
    if request.form.get("remove"):
        for p in (LOGO_PATH, LOGO_PATH + ".type"):
            if os.path.exists(p):
                os.remove(p)
        return jsonify(ok=True)
    f = request.files.get("file")
    if not f or f.mimetype not in ("image/png", "image/jpeg", "image/svg+xml", "image/webp"):
        return jsonify(error="Upload a PNG, JPG, SVG or WEBP image."), 400
    f.save(LOGO_PATH)
    open(LOGO_PATH + ".type", "w").write(f.mimetype)
    return jsonify(ok=True)


# ======================================================================= exports
def _ctx(d_from, d_to):
    st = settings()
    p, n = load_range(d_from, d_to)
    ms = {r["id"]: r["name"] for r in db().execute("SELECT id,name FROM machines")}
    return st, p, n, ms


def _send(wb, name):
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(buf, as_attachment=True, download_name=name,
                     mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


def _filter_staff(args):
    out = [s for s in all_staff() if s["active"] and s["track"]]
    if args.get("office"):
        out = [s for s in out if str(s["m"]) == args["office"]]
    if args.get("dep"):
        out = [s for s in out if s["dep"] == args["dep"]]
    if args.get("q"):
        q = args["q"].lower()
        out = [s for s in out if q in (s["name"] + " " + s["u"]).lower()]
    return out


@app.route("/export/month")
@login_required
def export_month():
    m = request.args.get("m") or date.today().isoformat()[:7]
    days = engine.month_days(m)
    st, p, n, ms = _ctx(days[0], days[-1])
    staff = _filter_staff(request.args)
    return _send(exports.month_sheet(m, days, staff, p, n, st, ms, settings()["company"]),
                 f"RapidEx_Attendance_{datetime.strptime(m, '%Y-%m').strftime('%B-%Y')}.xlsx")


@app.route("/export/day")
@login_required
def export_day():
    d = request.args.get("d") or date.today().isoformat()
    st, p, n, ms = _ctx(d, d)
    return _send(exports.day_sheet(d, _filter_staff(request.args), p, n, st, ms), f"RapidEx_Attendance_{d}.xlsx")


@app.route("/export/report")
@login_required
def export_report():
    sid, m = int(request.args["sid"]), request.args.get("m") or date.today().isoformat()[:7]
    s = next(x for x in all_staff() if x["sid"] == sid)
    days = engine.month_days(m)
    st, p, n, ms = _ctx(days[0], days[-1])
    return _send(exports.report_sheet(s, m, days, p, n, st, ms),
                 f"{s['name'].replace(' ', '_')}_{datetime.strptime(m, '%Y-%m').strftime('%B-%Y')}.xlsx")


@app.route("/export/ot")
@login_required
def export_ot():
    m = request.args.get("m") or date.today().isoformat()[:7]
    days = engine.month_days(m)
    st, p, n, ms = _ctx(days[0], days[-1])
    staff = [s for s in _filter_staff(request.args) if s["ot"]]
    return _send(exports.ot_sheet(m, days, staff, p, n, st, ms),
                 f"RapidEx_Overtime_{datetime.strptime(m, '%Y-%m').strftime('%B-%Y')}.xlsx")


@app.route("/export/punches")
@login_required
def export_punches():
    d = request.args.get("d") or date.today().isoformat()
    rows = db().execute("""SELECT p.*, s.name, m.name AS office, s.tracked FROM punches p
                           LEFT JOIN staff s ON s.machine_id=p.machine_id AND s.user_id=p.user_id
                           LEFT JOIN machines m ON m.id=p.machine_id WHERE p.ts BETWEEN ? AND ? ORDER BY p.ts""",
                        (d + " 00:00:00", d + " 23:59:59")).fetchall()
    return _send(exports.punch_sheet(d, rows), f"RapidEx_Punches_{d}.xlsx")


init_db()

if __name__ == "__main__":
    threading.Thread(target=scheduler, daemon=True).start()
    port = int(os.environ.get("PORTAL_PORT", 8080))
    print(f"RapidEx Attendance Portal on http://0.0.0.0:{port}")
    from waitress import serve
    serve(app, host="0.0.0.0", port=port, threads=8)
