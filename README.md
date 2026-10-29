# RapidEx Attendance Portal

Attendance portal for RapidEx offices using **ZKTeco MB20** fingerprint machines.
It reads punches from every office's machine, keeps the full history, and gives HR:

- **Dashboard**: who is in, late, not in yet or on leave today, by office
- **Monthly sheet**: the RapidEx HR sheet layout with codes P, L, A, H, E, S, WH, WO
- **Daily view**: one day, with quick filters for late, absent, missing clock-out and overtime
- **Employee report**: one person's month: attendance %, calendar, late total, hours, overtime (PDF and Excel)
- **Overtime**: monthly OT per person for payroll
- **Needs attention**: missing clock-outs, absences with no reason, very late arrivals
- **Employees**: designation, department, individual timing, late / hours / OT rules, bulk changes
- **Machines**: add offices, test the connection, choose which enrolled people are tracked
- **Settings**: default timing, grace, weekly off, holidays, OT minimum, sync interval, logo, logins

Machines sync automatically (every 3 hours by default) and with **Sync now**.
Nothing is ever deleted from the machines.

## Status codes

| Code | Meaning | Set by |
|---|---|---|
| P | Present | automatic: punched in on time |
| L | Late | automatic: clock-in after office time + grace |
| A | Absent | automatic: no punch on a working day |
| WO | Weekly off / holiday | automatic: weekly off day or company holiday |
| H | Half day | HR (or automatic if "short days count as H" is on) |
| E | Excused | HR |
| S | Sick leave | HR |
| WH | Work from home | HR |

An employee is **office + machine ID** (two machines can both have ID 1).

## Run on Railway (test hosting)

1. railway.com → New Project → **Deploy from GitHub repo** → `Hr-WebApp`.
2. In the service: **Settings → Volumes → Add volume**, mount path **`/data`** (keeps the database, logo and logins between deploys).
3. **Settings → Networking → Generate Domain** to get the portal's web address.
4. Open the address and create the admin login.

Every push to `main` redeploys automatically. Keep it at **1 replica** (the sync scheduler runs inside the app).

## Install on the server (once)

On the Ubuntu/Debian server, as root:

```bash
curl -fsSL -o setup_server.sh https://raw.githubusercontent.com/sohaib-29rapidex/Hr-WebApp/main/deploy/setup_server.sh  # or copy deploy/setup_server.sh over
sudo bash setup_server.sh
```

The script prints a **deploy key**. Add it in GitHub → this repository → Settings → Deploy keys
(read-only), press Enter, and it finishes the install. Then open `http://SERVER-IP:8080`
and create the admin login.

After that, the server checks GitHub every 5 minutes and deploys new changes by itself.

## Each office's machine

1. Give the MB20 a fixed local IP (Menu → Comm. → Ethernet).
2. On that office's router, forward **TCP and UDP port 4370** to the machine's local IP.
3. Set a **Comm Key** on the machine (port 4370 is reachable from the internet once forwarded).
4. In the portal: Machines → Add machine → public IP, port 4370, Comm Key → Test → Sync.
5. Choose tracked people: only the people you switch on appear on sheets and reports.

Quick connection test from any PC or the server:

```bash
python3 check_machine.py 203.0.113.10
```

## Useful commands (server)

```bash
journalctl -u rapidex-attendance -f            # live log
systemctl restart rapidex-attendance           # restart
sudo bash /opt/rapidex-attendance/deploy/update.sh   # deploy the latest version now
cat /var/lib/attendance/deploy.log             # deployment history
```

Data lives in `/var/lib/attendance/data` (database, logo, secret key). Back it up regularly.

## Files

- `app.py`: server, login, API, machine sync, scheduler
- `engine.py`: attendance rules (late, hours, OT, codes), shared with exports
- `exports.py`: Excel files (monthly HR sheet, day, employee report, OT, raw punches)
- `static/portal.js`, `static/portal.css`, `templates/`: the HR portal
- `deploy/`: server setup and auto-update
