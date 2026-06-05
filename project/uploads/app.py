"""
TPC HomeWatch — Flask Application
Run:  python app.py
Then open:  http://localhost:5000
"""

from flask import Flask, render_template, jsonify, request, redirect, url_for
from datetime import datetime, date
from dataclasses import dataclass, field, asdict
from typing import Optional
import json

app = Flask(__name__)

# ─────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────

@dataclass
class Owner:
    name: str
    phone: str
    email: str
    home_base: str


@dataclass
class AccessNote:
    lockbox_code: str
    alarm_code: str
    extra_notes: str


@dataclass
class Property:
    id: int
    name: str
    address: str
    type: str           # Seasonal | Vacant
    status: str         # active | due | alert
    service_freq: str   # Weekly | Bi-weekly | Monthly
    last_visit: str
    owner: Owner
    access: AccessNote
    gradient: str       # CSS gradient string for card header
    active_alert: Optional[str] = None


@dataclass
class ScheduleItem:
    id: int
    date: str
    day: str
    month: str
    time: str
    duration: str
    name: str
    property_name: str
    status: str         # due | urgent | ready | scheduled


@dataclass
class Alert:
    id: int
    type: str           # danger | warn | info
    icon: str           # tabler icon name
    title: str
    description: str
    timestamp: str
    property_name: str


@dataclass
class Invoice:
    id: int
    description: str
    owner_name: str
    due_date: str
    amount: float
    status: str         # paid | pending | overdue


@dataclass
class Vendor:
    id: int
    name: str
    category: str
    phone: str
    availability: str   # available | busy
    rating: float
    icon: str
    icon_bg: str
    icon_color: str


@dataclass
class ChecklistItem:
    id: int
    label: str
    category: str
    done: bool = False


# ─────────────────────────────────────────────────────────────────
# SEED DATA
# ─────────────────────────────────────────────────────────────────

PROPERTIES = [
    Property(
        id=1,
        name="Gulf Breeze Villa",
        address="4821 Bayside Dr, Naples FL 34102",
        type="Seasonal",
        status="alert",
        service_freq="Weekly",
        last_visit="May 12",
        owner=Owner("James Anderson", "(312) 555-0182", "janderson@email.com", "Chicago, IL"),
        access=AccessNote("7742", "4411#", "Pool equipment in back shed (key on ring). Alert neighbor Bob Marsh (239) 555-0199 if extended work."),
        gradient="linear-gradient(135deg,#1B4332,#52B788)",
        active_alert="Water intrusion under kitchen sink — Detected during routine inspection May 15. Possible slow pipe leak. Shut-off valve turned off as precaution.",
    ),
    Property(
        id=2,
        name="Pelican Bay Estate",
        address="702 Pelican Way, Naples FL 34108",
        type="Vacant",
        status="due",
        service_freq="Weekly",
        last_visit="May 8",
        owner=Owner("Robert Thornton", "(773) 555-0291", "rthorn@email.com", "Detroit, MI"),
        access=AccessNote("3391", "8822#", "Side entrance key in lockbox. Notify property manager if pool pump is off."),
        gradient="linear-gradient(135deg,#1D6FA4,#56A8DA)",
    ),
    Property(
        id=3,
        name="Harbor Lights Cottage",
        address="318 Marina Blvd, Bonita Springs FL 34134",
        type="Seasonal",
        status="active",
        service_freq="Bi-weekly",
        last_visit="May 14",
        owner=Owner("Linda Chen", "(415) 555-0044", "lchen@email.com", "San Francisco, CA"),
        access=AccessNote("5519", "1234#", "Dog door on back porch — keep closed. Alarm panel is in hallway closet."),
        gradient="linear-gradient(135deg,#7B4F12,#D4956A)",
    ),
    Property(
        id=4,
        name="Sunridge Manor",
        address="1204 Palmetto Dr, Sarasota FL 34231",
        type="Vacant",
        status="active",
        service_freq="Monthly",
        last_visit="May 13",
        owner=Owner("Maya Kapoor", "(212) 555-0377", "mkapoor@email.com", "New York, NY"),
        access=AccessNote("8847", "5566#", "Front gate code: 2211. Landscaper visits every Tuesday."),
        gradient="linear-gradient(135deg,#3D2B6B,#7C5CBF)",
    ),
]

SCHEDULE = [
    ScheduleItem(1, "May 15", "15", "MAY", "9:00 AM", "~90 min", "Weekly Inspection",    "Pelican Bay Estate",   "due"),
    ScheduleItem(2, "May 15", "15", "MAY", "2:00 PM", "~45 min", "Storm Check",           "Gulf Breeze Villa",   "urgent"),
    ScheduleItem(3, "May 15", "15", "MAY", "4:30 PM", "~60 min", "Move-in Prep Check",    "Harbor Lights Cottage","ready"),
    ScheduleItem(4, "May 16", "16", "MAY", "10:00 AM","~60 min", "Bi-weekly Inspection",  "Sunridge Manor",      "scheduled"),
    ScheduleItem(5, "May 19", "19", "MAY", "11:00 AM","~45 min", "AC System Check",       "Gulf Breeze Villa",   "scheduled"),
]

ALERTS = [
    Alert(1, "danger", "ti-droplet",      "Water intrusion",    "Possible leak under kitchen sink at Gulf Breeze Villa. Shut-off valve turned off.", "May 15 · 9:32 AM", "Gulf Breeze Villa"),
    Alert(2, "warn",   "ti-storm",        "Storm warning active","Tropical disturbance advisory in effect for Collier County. Schedule post-storm checks.", "May 15 · 7:00 AM", "Pelican Bay Estate"),
    Alert(3, "info",   "ti-file-invoice", "Invoice overdue",    "Invoice #1042 for M. Kapoor — $240 — is 14 days overdue.", "May 14", "Sunridge Manor"),
]

INVOICES = [
    Invoice(1, "Monthly Service — Gulf Breeze Villa",  "J. Anderson", "Due May 20, 2025", 350.00, "pending"),
    Invoice(2, "Weekly Inspection × 4",                "R. Thornton", "Due May 18, 2025", 480.00, "pending"),
    Invoice(3, "Emergency Storm Inspection",            "L. Chen",     "May 1, 2025",      175.00, "paid"),
    Invoice(4, "Monthly Retainer — Harbor Lights",     "L. Chen",     "May 1, 2025",      320.00, "paid"),
    Invoice(5, "Bi-weekly Service — Sunridge Manor",   "M. Kapoor",   "May 2, 2025",      240.00, "overdue"),
]

VENDORS = [
    Vendor(1, "AquaFix Plumbing",    "Plumbing",  "(239) 555-0134", "available", 4.9, "ti-droplet", "#E8F4FD", "var(--info)"),
    Vendor(2, "Bright Wire Electric","Electrical","(239) 555-0198", "available", 4.7, "ti-bolt",    "#FFF0E6", "var(--warn)"),
    Vendor(3, "CoolZone HVAC",       "HVAC",      "(239) 555-0277", "busy",      4.8, "ti-wind",    "#D8F3DC", "var(--accent)"),
    Vendor(4, "SecureNest Locksmith","Security",  "(239) 555-0312", "available", 4.6, "ti-lock",    "#F5E6F8", "#8B3DB8"),
]

CHECKLIST_TEMPLATE = [
    ChecklistItem(1,  "Exterior perimeter walk",           "Exterior"),
    ChecklistItem(2,  "All doors & windows locked",        "Exterior"),
    ChecklistItem(3,  "No signs of intrusion or vandalism","Security"),
    ChecklistItem(4,  "A/C set & running properly",        "Systems"),
    ChecklistItem(5,  "No water leaks or moisture",        "Interior"),
    ChecklistItem(6,  "Electrical panel check",            "Systems"),
    ChecklistItem(7,  "Pool water level & clarity",        "Pool"),
    ChecklistItem(8,  "Mail & packages collected",         "Exterior"),
    ChecklistItem(9,  "Smoke & CO detectors test",         "Safety"),
    ChecklistItem(10, "Exterior photos taken",             "Documentation"),
]

STATS = {
    "active_properties": 12,
    "alerts_open": len(ALERTS),
    "visits_this_week": 5,
    "monthly_revenue": 4200,
    "may_revenue": 4200,
    "outstanding": 850,
    "paid_invoices": 9,
    "pending_invoices": 3,
}

HISTORY = [
    {"dot": "danger", "title": "Water intrusion found",        "desc": "Leak under kitchen sink. Shut-off engaged. Plumber dispatched.", "time": "May 15, 2025 · 9:32 AM"},
    {"dot": "",       "title": "Weekly inspection completed",  "desc": "18 point checklist, all secure. Report sent to owner.",           "time": "May 8, 2025"},
    {"dot": "warn",   "title": "Lanai screen damage",          "desc": "Minor tear from wind. Vendor quote requested.",                   "time": "May 1, 2025"},
    {"dot": "",       "title": "Weekly inspection completed",  "desc": "All systems normal. Photos taken and report sent.",               "time": "Apr 24, 2025"},
]

PHOTOS = [
    {"bg": "#D8F3DC", "emoji": "🏠", "tag": "Front exterior"},
    {"bg": "#FFF0E6", "emoji": "🚿", "tag": "Kitchen leak"},
    {"bg": "#E8F4FD", "emoji": "🌊", "tag": "Pool area"},
]

# Group schedule by date label
def grouped_schedule():
    groups = {}
    labels = {
        "May 15": "Thursday, May 15",
        "May 16": "Friday, May 16",
        "May 19": "Monday, May 19",
    }
    for item in SCHEDULE:
        label = labels.get(item.date, item.date)
        groups.setdefault(label, []).append(item)
    return groups


# ─────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────

@app.route("/")
def dashboard():
    today_items = [s for s in SCHEDULE if s.date == "May 15"]
    recent_alerts = ALERTS[:2]
    return render_template("index.html",
        page="dashboard",
        greeting="Good morning, Maria 👋",
        subtext="Thursday, May 15 · 3 properties need attention",
        stats=STATS,
        today_schedule=today_items,
        recent_alerts=recent_alerts,
    )

@app.route("/properties")
def properties():
    return render_template("index.html",
        page="properties",
        properties=PROPERTIES,
    )

@app.route("/properties/<int:prop_id>")
def property_detail(prop_id):
    prop = next((p for p in PROPERTIES if p.id == prop_id), None)
    if not prop:
        return redirect(url_for("properties"))
    return render_template("property_detail.html",
        prop=prop,
        history=HISTORY,
        photos=PHOTOS,
        checklist_progress=78,
        checklist_done=14,
        checklist_total=18,
    )

@app.route("/schedule")
def schedule():
    return render_template("index.html",
        page="schedule",
        schedule_groups=grouped_schedule(),
    )

@app.route("/inspections/<int:sched_id>")
def inspection(sched_id):
    item = next((s for s in SCHEDULE if s.id == sched_id), SCHEDULE[0])
    prop = next((p for p in PROPERTIES if p.name == item.property_name), PROPERTIES[0])
    return render_template("inspection.html",
        item=item,
        prop=prop,
        checklist=CHECKLIST_TEMPLATE,
    )

@app.route("/billing")
def billing():
    return render_template("index.html",
        page="billing",
        stats=STATS,
        invoices=INVOICES,
    )

@app.route("/vendors")
def vendors():
    return render_template("index.html",
        page="vendors",
        vendors=VENDORS,
    )

@app.route("/alerts")
def alerts():
    return render_template("alerts.html",
        alerts=ALERTS,
    )

# ── API endpoints (JSON) ──────────────────────────────────────────

@app.route("/api/properties")
def api_properties():
    return jsonify([asdict(p) for p in PROPERTIES])

@app.route("/api/alerts")
def api_alerts():
    return jsonify([asdict(a) for a in ALERTS])

@app.route("/api/vendors")
def api_vendors():
    return jsonify([asdict(v) for v in VENDORS])

@app.route("/api/checklist/<int:item_id>/toggle", methods=["POST"])
def toggle_checklist(item_id):
    for item in CHECKLIST_TEMPLATE:
        if item.id == item_id:
            item.done = not item.done
            return jsonify({"id": item_id, "done": item.done})
    return jsonify({"error": "not found"}), 404


# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
