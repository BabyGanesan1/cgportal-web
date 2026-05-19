// ChatBot.tsx — Casagrand Helpdesk Widget
"use client";
import React, { useState, useEffect, useRef, CSSProperties, FormEvent, KeyboardEvent } from "react";

/* ─── Constants ──────────────────────────────────────────── */
const API_URL = process.env.NEXT_PUBLIC_CHAT_API || "http://127.0.0.1:5000/api/chatbot/chat";
const LEAD_URL = process.env.NEXT_PUBLIC_LEAD_API || "http://127.0.0.1:5000/lead";

const SESSION_ID: string =
    typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

/* ─── Types ──────────────────────────────────────────────── */
interface UnitDetail {
    unit_no: string;
    block?: string;
    phase?: string;
    status: string;
    available: boolean;
    floor: string | number;
    facing: string;
    bhk: string;
    unit_type: string;
    carpet_area: string;
    super_builtup_area: string;
    basic_rate: string;
    basic_rate_per_sqft?: string;
    plc_charges_per_sqft?: string;
    frc_charges_per_sqft?: string;
    land_rate_sqft?: string;
    land_rate_sqyards?: string;
    land_rate_lakhs?: string;
    car_park_type: string;
    no_of_car_park?: string | number;
    car_park_charges?: string;
    private_terrace?: string;
    uds?: string;
    land_area_sqft?: string;
    land_area_sqyards?: string;
    infra_charges?: string;
    other_charges?: string;
    modification?: string;
    total_values?: string;
    gst: string;
    discount: string | null;
    grand_total: string;
    this_week_price?: string;
    next_week_price?: string;
    this_week_price_incl_car_park?: string;
    next_week_price_incl_car_park?: string;
    plc_reason?: string | null;
    otp?: string | null;
    image_url?: string | null;
    virtual_tour_url?: string | null;
}

interface Message {
    role: "bot" | "user";
    type?: "text" | "summary" | "units" | "lead" | "bhk_picker";
    text: string;
    buttons?: string[];
    isLast?: boolean;
    project?: string;
    bhk?: string;
    total?: number;
    available?: number;
    sold?: number;
    units?: UnitDetail[];
    availableOnly?: boolean;
    bhkOptions?: string[];
    selectedBhks?: string[];
}

interface ApiResponse {
    type?: string;
    text?: string;
    reply?: string;
    buttons?: string[];
    project?: string;
    bhk?: string;
    total?: number;
    available?: number;
    sold?: number;
    units?: UnitDetail[];
    availableOnly?: boolean;
    bhkOptions?: string[];
    selectedBhks?: string[];
}

interface LeadForm { name: string; phone: string; email: string; }
interface VisitForm { name: string; email: string; mobile: string; date: string; time: string; }
interface VisitFormErrors { name?: string; email?: string; mobile?: string; date?: string; time?: string; }

const EMPTY_VISIT_FORM: VisitForm = { name: "", email: "", mobile: "", date: "", time: "" };
const EMPTY_LEAD: LeadForm = { name: "", phone: "", email: "" };

/* ═══════════════════════════════════════════════════════════
   FLOOR PLAN MODAL
═══════════════════════════════════════════════════════════ */
function FloorPlanModal({ unit, onClose }: { unit: UnitDetail; onClose: () => void }) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "+" || e.key === "=") setZoom(z => Math.min(z + 0.2, 3));
            if (e.key === "-") setZoom(z => Math.max(z - 0.2, 0.5));
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    function handleWheel(e: React.WheelEvent) {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(z + (e.deltaY > 0 ? -0.1 : 0.1), 0.5), 3));
    }
    function handleMouseDown(e: React.MouseEvent) { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); }
    function handleMouseMove(e: React.MouseEvent) { if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }
    function handleMouseUp() { setDragging(false); }
    function resetView() { setZoom(1); setPan({ x: 0, y: 0 }); }

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,20,0.92)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(6px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ width: "100%", maxWidth: "780px", background: "linear-gradient(145deg,#0f1623,#111827)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", animation: "cgSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}>
                <div style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>🏗️</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>Floor Plan</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>Unit {unit.unit_no} · {unit.bhk} · Floor {unit.floor} · {unit.facing} Facing</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(0,0,0,0.22)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "#fff", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" as const }}>
                    {[["＋ Zoom In", () => setZoom(z => Math.min(z + 0.2, 3))], ["－ Zoom Out", () => setZoom(z => Math.max(z - 0.2, 0.5))], ["↺ Reset", resetView]].map(([label, fn], i) => (
                        <button key={i} onClick={fn as () => void} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: i === 2 ? "#f59e0b" : "rgba(255,255,255,0.7)", fontSize: "11px", fontWeight: 600, padding: "5px 11px", cursor: "pointer" }}>{label as string}</button>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{Math.round(zoom * 100)}%</span>
                </div>
                <div ref={containerRef} onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                    style={{ position: "relative", overflow: "hidden", height: "420px", cursor: dragging ? "grabbing" : "grab", userSelect: "none", background: "radial-gradient(ellipse at center,rgba(30,40,60,0.8) 0%,rgba(10,15,25,1) 100%)" }}>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%,-50%) translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "center center", transition: dragging ? "none" : "transform 0.1s ease" }}>
                        <svg viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "560px", maxWidth: "none", display: "block" }}>
                            <rect x="40" y="30" width="520" height="340" rx="4" stroke="#f59e0b" strokeWidth="3" fill="rgba(245,158,11,0.05)" />
                            <rect x="40" y="30" width="220" height="180" stroke="#f59e0b" strokeWidth="2" fill="rgba(245,158,11,0.08)" />
                            <text x="150" y="120" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="600">LIVING ROOM</text>
                            <text x="150" y="138" textAnchor="middle" fill="#f59e0b" fontSize="10">18&apos; × 14&apos;</text>
                            <rect x="260" y="30" width="200" height="170" stroke="#a78bfa" strokeWidth="2" fill="rgba(167,139,250,0.08)" />
                            <text x="360" y="115" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600">MASTER BEDROOM</text>
                            <text x="360" y="133" textAnchor="middle" fill="#a78bfa" fontSize="10">14&apos; × 12&apos;</text>
                            <rect x="460" y="30" width="100" height="170" stroke="#86efac" strokeWidth="2" fill="rgba(134,239,172,0.08)" />
                            <text x="510" y="110" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="600">BED 2</text>
                            <rect x="40" y="210" width="140" height="160" stroke="#fde68a" strokeWidth="2" fill="rgba(253,230,138,0.08)" />
                            <text x="110" y="295" textAnchor="middle" fill="#fde68a" fontSize="12" fontWeight="600">KITCHEN</text>
                            <rect x="180" y="210" width="80" height="80" stroke="#67e8f9" strokeWidth="2" fill="rgba(103,232,249,0.08)" />
                            <text x="220" y="253" textAnchor="middle" fill="#67e8f9" fontSize="10" fontWeight="600">BATH</text>
                            <rect x="40" y="30" width="50" height="100" stroke="#fca5a5" strokeWidth="1.5" strokeDasharray="6,3" fill="rgba(252,165,165,0.06)" />
                            <text x="65" y="83" textAnchor="middle" fill="#fca5a5" fontSize="9">BALCONY</text>
                            <text x="300" y="390" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="11">
                                {unit.super_builtup_area ? `${unit.super_builtup_area} SBA · ${unit.carpet_area} Carpet` : "Total: — sft SBA · — sft Carpet"}
                            </text>
                        </svg>
                    </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.35)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "8px" }}>
                    <div style={{ display: "flex", gap: "16px", fontSize: "11px" }}>
                        <span style={{ color: "#f59e0b" }}>■ Living</span>
                        <span style={{ color: "#c4b5fd" }}>■ Bed</span>
                        <span style={{ color: "#fde68a" }}>■ Kitchen</span>
                        <span style={{ color: "#67e8f9" }}>■ Bath</span>
                        <span style={{ color: "#fca5a5" }}>⬚ Balcony</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>Not to scale · Illustrative only</span>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   VISIT BOOKING MODAL
═══════════════════════════════════════════════════════════ */
function VisitBookingModal({ unit, visitType, selectedDate, selectedTime, onClose, onConfirmed }: {
    unit: UnitDetail; visitType: "Offline" | "Virtual"; selectedDate: string; selectedTime: string;
    onClose: () => void; onConfirmed: (form: VisitForm) => void;
}) {
    const [form, setForm] = useState<VisitForm>({ ...EMPTY_VISIT_FORM, date: selectedDate, time: selectedTime });
    const [errors, setErrors] = useState<VisitFormErrors>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    function validate() {
        const errs: VisitFormErrors = {};
        if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Enter your full name";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email";
        if (!/^[\d\s+\-()\u0900-\u097F]{7,15}$/.test(form.mobile.trim())) errs.mobile = "Enter a valid mobile";
        if (!form.date) errs.date = "Pick a date";
        if (!form.time) errs.time = "Pick a time";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setSubmitted(true);
        setTimeout(() => onConfirmed(form), 1800);
    }

    const today = new Date().toISOString().split("T")[0];
    const inp = (hasErr: boolean): CSSProperties => ({ width: "100%", border: `1.5px solid ${hasErr ? "#ef4444" : "#e5dfd4"}`, borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none", color: "#1a1a1a", background: hasErr ? "#fff5f5" : "#faf9f6", boxSizing: "border-box", fontFamily: "inherit" });

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(3px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", animation: "cgSlideUp 0.25s ease" }}>
                <div style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>{visitType === "Virtual" ? "💻" : "🏢"}</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>Book a {visitType} Visit</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>Unit {unit.unit_no} · {unit.bhk}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(0,0,0,0.2)", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", color: "#fff", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ padding: "20px 20px 22px" }}>
                    {submitted ? (
                        <div style={{ textAlign: "center", padding: "16px 0" }}>
                            <div style={{ width: "58px", height: "58px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: "26px" }}>✅</div>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#16a34a", marginBottom: "6px" }}>Visit Booked!</div>
                            <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.7" }}>
                                Hi <strong>{form.name.split(" ")[0]}</strong>, your <strong>{visitType}</strong> visit is confirmed.<br />
                                📅 {form.date} &nbsp; ⏰ {form.time}<br />
                                We'll reach you at <strong>{form.mobile}</strong>.
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                { label: "Full Name *", type: "text", key: "name", placeholder: "Eg: Arun Kumar" },
                                { label: "Email Address *", type: "email", key: "email", placeholder: "Eg: arun@email.com" },
                                { label: "Mobile Number *", type: "tel", key: "mobile", placeholder: "Eg: +91 98765 43210" },
                            ].map(({ label, type, key, placeholder }) => (
                                <div key={key}>
                                    <label style={VM.label}>{label}</label>
                                    <input type={type} style={inp(!!(errors as Record<string, string>)[key])} placeholder={placeholder}
                                        value={form[key as keyof VisitForm]}
                                        onChange={(e) => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: undefined })); }} />
                                    {(errors as Record<string, string>)[key] && <p style={VM.err}>{(errors as Record<string, string>)[key]}</p>}
                                </div>
                            ))}
                            <div style={{ display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={VM.label}>Preferred Date *</label>
                                    <input type="date" min={today} style={inp(!!errors.date)} value={form.date}
                                        onChange={(e) => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: undefined })); }} />
                                    {errors.date && <p style={VM.err}>{errors.date}</p>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={VM.label}>Preferred Time *</label>
                                    <input type="time" style={inp(!!errors.time)} value={form.time}
                                        onChange={(e) => { setForm(f => ({ ...f, time: e.target.value })); setErrors(er => ({ ...er, time: undefined })); }} />
                                    {errors.time && <p style={VM.err}>{errors.time}</p>}
                                </div>
                            </div>
                            <button type="submit" style={{ width: "100%", background: "linear-gradient(90deg,#f59e0b,#fbbf24)", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                Confirm Visit
                            </button>
                            <p style={{ fontSize: "11px", color: "#aaa", textAlign: "center", margin: 0 }}>Our team will confirm within 24 hours</p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
const VM: Record<string, CSSProperties> = {
    label: { display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "5px" },
    err: { margin: "4px 0 0", fontSize: "11px", color: "#ef4444" },
};

/* ═══════════════════════════════════════════════════════════
   SUMMARY CARD
═══════════════════════════════════════════════════════════ */
function SummaryCard({ msg }: { msg: Message }) {
    const availPct = msg.total ? Math.round(((msg.available || 0) / msg.total) * 100) : 0;
    return (
        <div style={S.summaryCard}>
            <div style={S.summaryTitle}>{msg.project}</div>
            <div style={S.summaryBhk}>{msg.bhk}</div>
            <div style={S.summaryStats}>
                {[
                    { n: msg.total, l: "Total", c: "#f59e0b", bc: "#f59e0b" },
                    { n: msg.available, l: "Available", c: "#16a34a", bc: "#22c55e" },
                    { n: msg.sold, l: "Sold", c: "#dc2626", bc: "#ef4444" },
                ].map(({ n, l, c, bc }) => (
                    <div key={l} style={{ ...S.statBox, borderColor: bc }}>
                        <span style={{ ...S.statNum, color: c }}>{n}</span>
                        <span style={S.statLabel}>{l}</span>
                    </div>
                ))}
            </div>
            <div style={S.availBar}><div style={{ ...S.availFill, width: availPct + "%" }} /></div>
            <div style={S.availLabel}>{availPct}% availability</div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   BHK PICKER
═══════════════════════════════════════════════════════════ */
function BHKPicker({ msg, onSelect }: { msg: Message; onSelect: (bhk: string) => void }) {
    const options = msg.bhkOptions || [];
    const selected = msg.selectedBhks || [];
    return (
        <div style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "12px", padding: "12px" }}>
            <div style={{ fontSize: "12px", marginBottom: "10px", lineHeight: "1.6" }}>
                {selected.length > 0 ? (
                    <>
                        <span style={{ fontWeight: 700, color: "#f59e0b" }}>Selected: </span>
                        {selected.map((s, i) => (
                            <span key={i} style={{ display: "inline-block", background: "#f59e0b", color: "#fff", borderRadius: "12px", padding: "2px 10px", fontSize: "11px", fontWeight: 700, marginRight: "4px" }}>{s} ✓</span>
                        ))}
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>Tap more to add, or confirm below.</div>
                    </>
                ) : (
                    <span style={{ color: "#888" }}>Tap BHK types to select <strong>(multiple allowed)</strong>:</span>
                )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px", marginBottom: "10px" }}>
                {options.map((bhk) => {
                    const isSel = selected.includes(bhk);
                    return (
                        <button key={bhk} onClick={() => onSelect(bhk)} style={{ background: isSel ? "#f59e0b" : "#fff", color: isSel ? "#fff" : "#f59e0b", border: "2px solid #f59e0b", borderRadius: "20px", padding: "7px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                            {bhk}{isSel ? " ✓" : ""}
                        </button>
                    );
                })}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
                {selected.length > 0 && (
                    <button onClick={() => onSelect("Confirm Selection")} style={{ flex: 1, background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", padding: "9px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        ✅ Confirm ({selected.length} BHK{selected.length > 1 ? "s" : ""})
                    </button>
                )}
                <button onClick={() => onSelect("All BHK")} style={{ flex: selected.length > 0 ? "0 0 auto" : 1, background: "#fff", color: "#888", border: "1.5px solid #ddd", borderRadius: "8px", padding: "9px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    All BHK
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   UNIT CARD — ALL 42 COLUMNS
═══════════════════════════════════════════════════════════ */
type BookingStep = "idle" | "visit_type" | "select_date" | "select_time" | "fill_form" | "confirmed";

function getNextDates(): string[] {
    const dates: string[] = [];
    const d = new Date();
    while (dates.length < 4) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) dates.push(d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }));
    }
    return dates;
}
const VISIT_TIMES = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"];

function UnitCard({ unit, projectName, onVideoClick, onFloorPlanClick, onBookNow }: { unit: UnitDetail; projectName?: string; onVideoClick: (url: string) => void; onFloorPlanClick: (unit: UnitDetail) => void; onBookNow?: (projectName: string) => void; }) {
    const [open, setOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<BookingStep>("idle");
    const [visitType, setVisitType] = useState<"Offline" | "Virtual" | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [confirmedVisit, setConfirmedVisit] = useState<VisitForm | null>(null);

    const statusColor = unit.available ? "#16a34a" : "#dc2626";
    const statusBg = unit.available ? "#dcfce7" : "#fee2e2";
    const dates = getNextDates();
    const virtualTourUrl = "https://cgprop.digilogy.co/assets/videos/building.mp4";

    function resetBooking() { setBookingStep("idle"); setVisitType(null); setSelectedDate(null); setSelectedTime(null); setShowVisitModal(false); setConfirmedVisit(null); }

    async function handleVisitConfirmed(form: VisitForm) {
        setConfirmedVisit(form);
        setShowVisitModal(false);
        // setBookingStep("confirmed");
        // try {
        //     await fetch(LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, email: form.email, phone: form.mobile, project: "Visit Booking - Casagrand" }) });
        // } catch (err) { console.error("Visit email error:", err); }
    }

    const pill = (label: string, onClick: () => void, active = false) => (
        <button key={label} onClick={onClick} style={{ background: active ? "#f59e0b" : "#fff", color: active ? "#fff" : "#f59e0b", border: "1.5px solid #f59e0b", borderRadius: "16px", padding: "5px 11px", fontSize: "11px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>{label}</button>
    );

    const priceRows: [string, string | null | undefined][] = [
        ["Basic Rate", unit.basic_rate || unit.basic_rate_per_sqft],
        ["PLC Charges", unit.plc_charges_per_sqft],
        ["FRC Charges", unit.frc_charges_per_sqft],
        ["Car Park Type", unit.car_park_type],
        ["No. of Car Parks", unit.no_of_car_park?.toString()],
        ["Car Park Charges", unit.car_park_charges],
        ["Private Terrace", unit.private_terrace],
        ["Infra Charges", unit.infra_charges],
        ["Other Charges", unit.other_charges],
        ["Modification", unit.modification],
        ["Total Value", unit.total_values],
        ["GST", unit.gst],
    ];
    if (unit.discount) priceRows.push(["Discount", unit.discount]);

    const areaRows: [string, string | null | undefined][] = [
        ["Carpet Area", unit.carpet_area],
        ["Super Builtup", unit.super_builtup_area],
        ["Private Terrace", unit.private_terrace],
        ["UDS", unit.uds],
        ["Land Area (sqft)", unit.land_area_sqft],
        ["Land Area (sqyards)", unit.land_area_sqyards],
        ["Land Rate/sqft", unit.land_rate_sqft],
        ["Land Rate/sqyard", unit.land_rate_sqyards],
        ["Land Rate (Lakhs)", unit.land_rate_lakhs],
    ];

    const weeklyRows: [string, string | null | undefined][] = [
        ["This Week Price", unit.this_week_price],
        ["Next Week Price", unit.next_week_price],
        ["This Week (incl. Park)", unit.this_week_price_incl_car_park],
        ["Next Week (incl. Park)", unit.next_week_price_incl_car_park],
    ];

    return (
        <>
            {showVisitModal && visitType && selectedDate && selectedTime && (
                <VisitBookingModal unit={unit} visitType={visitType} selectedDate={selectedDate} selectedTime={selectedTime} onClose={() => setShowVisitModal(false)} onConfirmed={handleVisitConfirmed} />
            )}
            <div style={S.unitCard}>
                <div style={S.unitHeader} onClick={() => setOpen(o => !o)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={S.unitNo}>{unit.unit_no}</span>
                        <span style={{ ...S.unitStatus, background: statusBg, color: statusColor }}>
                            {unit.available ? "✓ Available" : "✗ " + (unit.status.length > 14 ? unit.status.slice(0, 14) + "…" : unit.status)}
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={S.unitPrice}>{unit.grand_total}</span>
                        <span style={{ fontSize: "10px", color: "#999", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
                    </div>
                </div>
                <div style={S.unitQuick}>
                    {unit.block && unit.block !== "N/A" && <span>🏗 Block {unit.block}</span>}
                    {unit.phase && unit.phase !== "N/A" && <span>📍 Phase {unit.phase}</span>}
                    <span>🏢 Floor {unit.floor}</span>
                    <span>🧭 {unit.facing}</span>
                    <span>📐 {unit.carpet_area}</span>
                    <span>🛏 {unit.bhk}{unit.unit_type && unit.unit_type !== "N/A" ? " · " + unit.unit_type : ""}</span>
                </div>

                {open && (
                    <div style={S.unitExpanded}>
                        <div style={S.sectionLabel}>📐 Area Details</div>
                        {areaRows.filter(([, v]) => v && v !== "N/A").map(([k, v]) => (
                            <div key={k} style={S.unitRow}>
                                <span style={S.unitKey}>{k}</span>
                                <span style={S.unitVal}>{v}</span>
                            </div>
                        ))}

                        <div style={{ ...S.sectionLabel, marginTop: "8px" }}>💰 Pricing Breakdown</div>
                        {priceRows.filter(([, v]) => v && v !== "N/A").map(([k, v]) => (
                            <div key={k} style={S.unitRow}>
                                <span style={S.unitKey}>{k}</span>
                                <span style={{ ...S.unitVal, color: k === "Discount" ? "#16a34a" : "#1a1a1a" }}>{k === "Discount" ? "- " + v : v}</span>
                            </div>
                        ))}
                        <div style={{ ...S.unitRow, borderTop: "1px solid #ffedd5", marginTop: "4px", paddingTop: "6px" }}>
                            <span style={{ ...S.unitKey, fontWeight: 700 }}>Grand Total</span>
                            <span style={{ ...S.unitVal, fontWeight: 700, color: "#f59e0b" }}>{unit.grand_total}</span>
                        </div>

                        {weeklyRows.some(([, v]) => v && v !== "N/A") && (
                            <>
                                <div style={{ ...S.sectionLabel, marginTop: "8px" }}>📅 Weekly Pricing</div>
                                {weeklyRows.filter(([, v]) => v && v !== "N/A").map(([k, v]) => (
                                    <div key={k} style={S.unitRow}>
                                        <span style={S.unitKey}>{k}</span>
                                        <span style={S.unitVal}>{v}</span>
                                    </div>
                                ))}
                            </>
                        )}

                        <div style={{ ...S.unitRow, marginTop: "4px" }}>
                            <span style={S.unitKey}>Status</span>
                            <span style={{ ...S.unitVal, color: statusColor, fontWeight: 600 }}>{unit.status}</span>
                        </div>

                        {unit.plc_reason && (
                            <div style={S.unitRow}>
                                <span style={S.unitKey}>PLC Reason</span>
                                <span style={S.unitVal}>{unit.plc_reason}</span>
                            </div>
                        )}

                        {unit.available && bookingStep === "idle" && (
                            <>
                                <div style={{ marginTop: "10px", display: "flex", gap: "6px" }}>
                                    <button onClick={() => onBookNow ? onBookNow(projectName || "") : window.open("https://www.casagrand.co.in/payment", "_blank")} style={{ flex: 1, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>🏠 Book Now</button>
                                    <button onClick={() => setBookingStep("visit_type")} style={{ flex: 1, background: "#fff", color: "#f59e0b", border: "1.5px solid #f59e0b", borderRadius: "8px", padding: "8px 4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>📅 Site Visit</button>
                                    <button onClick={() => onVideoClick(virtualTourUrl)} style={{ flex: 1, background: "#fff", color: "#f59e0b", border: "1.5px solid #f59e0b", borderRadius: "8px", padding: "8px 4px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>🎥 Virtual Tour</button>
                                </div>
                                <button onClick={() => onFloorPlanClick(unit)} style={{ marginTop: "6px", width: "100%", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff", border: "none", borderRadius: "8px", padding: "8px", fontSize: "11px", fontWeight: 700, cursor: "pointer", boxSizing: "border-box" as const }}>
                                    🏗️ View Floor Plan
                                </button>
                            </>
                        )}

                        {unit.available && bookingStep === "visit_type" && (
                            <div style={{ marginTop: "10px", background: "#f9fafb", borderRadius: "8px", padding: "10px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>📅 Choose Visit Type</div>
                                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                    {pill("🏢 Offline", () => { setVisitType("Offline"); setBookingStep("select_date"); })}
                                    {pill("💻 Virtual", () => { setVisitType("Virtual"); setBookingStep("select_date"); })}
                                </div>
                                <button onClick={resetBooking} style={{ fontSize: "10px", color: "#aaa", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
                            </div>
                        )}

                        {unit.available && bookingStep === "select_date" && (
                            <div style={{ marginTop: "10px", background: "#f9fafb", borderRadius: "8px", padding: "10px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>{visitType} · Select Date</div>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "8px" }}>
                                    {dates.map(d => pill(d, () => { setSelectedDate(d); setBookingStep("select_time"); }, selectedDate === d))}
                                </div>
                                <button onClick={() => setBookingStep("visit_type")} style={{ fontSize: "10px", color: "#aaa", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
                            </div>
                        )}

                        {unit.available && bookingStep === "select_time" && (
                            <div style={{ marginTop: "10px", background: "#f9fafb", borderRadius: "8px", padding: "10px" }}>
                                <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "8px" }}>{visitType} · {selectedDate} · Select Time</div>
                                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "8px" }}>
                                    {VISIT_TIMES.map(t => pill(t, () => { setSelectedTime(t); setBookingStep("fill_form"); setShowVisitModal(true); }, selectedTime === t))}
                                </div>
                                <button onClick={() => setBookingStep("select_date")} style={{ fontSize: "10px", color: "#aaa", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
                            </div>
                        )}

                        {unit.available && bookingStep === "fill_form" && !showVisitModal && (
                            <div style={{ marginTop: "10px", background: "#f9fafb", borderRadius: "8px", padding: "10px", textAlign: "center" as const }}>
                                <div style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>Fill in your details to confirm</div>
                                <button onClick={() => setShowVisitModal(true)} style={{ marginTop: "8px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Open Form →</button>
                                <br /><button onClick={resetBooking} style={{ fontSize: "10px", color: "#aaa", background: "none", border: "none", cursor: "pointer", marginTop: "6px" }}>← Start over</button>
                            </div>
                        )}

                        {unit.available && bookingStep === "confirmed" && confirmedVisit && (
                            <div style={{ marginTop: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", textAlign: "center" as const }}>
                                <div style={{ fontSize: "20px", marginBottom: "4px" }}>✅</div>
                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a", marginBottom: "6px" }}>Visit Booked!</div>
                                <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.7" }}>
                                    <strong>{visitType} Visit</strong><br />
                                    📅 {confirmedVisit.date} &nbsp; ⏰ {confirmedVisit.time}<br />
                                    👤 {confirmedVisit.name}<br />📞 {confirmedVisit.mobile}
                                </div>
                                <button onClick={resetBooking} style={{ marginTop: "8px", fontSize: "10px", color: "#f59e0b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Change</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════
   UNITS LIST
═══════════════════════════════════════════════════════════ */
function UnitsList({ msg, onVideoClick, onFloorPlanClick, onBookNow }: { msg: Message; onVideoClick: (url: string) => void; onFloorPlanClick: (unit: UnitDetail) => void; onBookNow?: (projectName: string) => void; }) {
    const units = msg.units || [];
    const projectName = msg.project;
    const available = units.filter(u => u.available);
    const sold = units.filter(u => !u.available);
    return (
        <div style={S.unitsWrap}>
            <div style={S.unitsHeader}>
                <div style={S.unitsTitle}>Property List</div>
                <div style={S.unitsCount}>{available.length} Available</div>
            </div>

            {available.length > 0 && (
                <>
                    <div style={S.unitsSection}>AVAILABLE UNITS</div>
                    {available.map((u, i) => <UnitCard key={i} unit={u} projectName={projectName} onVideoClick={onVideoClick} onFloorPlanClick={onFloorPlanClick} onBookNow={onBookNow} />)}
                </>
            )}

            {sold.length > 0 && (
                <>
                    <div style={{ ...S.unitsSection, color: "#aaa", background: "#f5f5f5" }}>{available.length > 0 ? "SOLD / BLOCKED" : "NO UNITS AVAILABLE"}</div>
                    {sold.map((u, i) => <UnitCard key={i} unit={u} projectName={projectName} onVideoClick={onVideoClick} onFloorPlanClick={onFloorPlanClick} onBookNow={onBookNow} />)}
                </>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   VIDEO MODAL
═══════════════════════════════════════════════════════════ */
function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);
    const isEmbed = url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com") || url.includes("matterport.com");
    function toEmbed(raw: string) {
        if (raw.includes("youtu.be/")) return `https://www.youtube.com/embed/${raw.split("youtu.be/")[1].split("?")[0]}?autoplay=1`;
        if (raw.includes("youtube.com/watch")) return `https://www.youtube.com/embed/${new URLSearchParams(raw.split("?")[1]).get("v")}?autoplay=1`;
        if (raw.includes("vimeo.com/")) return `https://player.vimeo.com/video/${raw.split("vimeo.com/")[1].split("?")[0]}?autoplay=1`;
        return raw;
    }
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ width: "100%", maxWidth: "860px", background: "#1a1a1a", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column" }}>
                <div style={{ background: "linear-gradient(90deg,#f59e0b,#fbbf24)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px" }}>🎥</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>360° Virtual Tour</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>Explore your future home</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(0,0,0,0.25)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "#fff", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
                    {isEmbed
                        ? <iframe src={toEmbed(url)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
                        : <video ref={videoRef} src={url} controls autoPlay style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function ChatBot({ totalProjects = 5, withUnits = 5, cities = 2, onBookNow }: { totalProjects?: number; withUnits?: number; cities?: number; onBookNow?: (projectName: string) => void; }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showLead, setShowLead] = useState(false);
    const [lead, setLead] = useState<LeadForm>(EMPTY_LEAD);
    const [leadSent, setLeadSent] = useState(false);
    const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
    const [floorPlanUnit, setFloorPlanUnit] = useState<UnitDetail | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // ── Lock body scroll when a modal is open ──
    useEffect(() => {
        document.body.style.overflow = (videoModalUrl || floorPlanUnit) ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [videoModalUrl, floorPlanUnit]);

    // ── Trigger welcome message on mount ──
    useEffect(() => { callBot("hello", true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, loading, showLead]);

    function markOld(prev: Message[]): Message[] { return prev.map(m => ({ ...m, isLast: false })); }

    async function callBot(text: string, silent = false) {
        if (!text.trim()) return;
        if (!silent) setMessages(prev => [...markOld(prev), { role: "user", text }]);
        setLoading(true);
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data: ApiResponse = await res.json();
            const botText = data.text || data.reply || "Sorry, something went wrong.";

            setMessages(prev => [...markOld(prev), {
                role: "bot",
                type: (data.type as Message["type"]) || "text",
                text: botText,
                buttons: Array.isArray(data.buttons) ? data.buttons : [],
                isLast: true,
                project: data.project,
                bhk: data.bhk,
                total: data.total,
                available: data.available,
                sold: data.sold,
                units: data.units,
                availableOnly: data.availableOnly,
                bhkOptions: data.bhkOptions,
                selectedBhks: data.selectedBhks,
            }]);

            if (data.type === "lead") setTimeout(() => setShowLead(true), 400);
        } catch (err) {
            console.error("Chat API error:", err);
            setMessages(prev => [...markOld(prev), {
                role: "bot",
                text: "⚠️ Could not connect to server. Please make sure the backend is running on port 5000.",
                buttons: ["Try Again"],
                isLast: true,
            }]);
        } finally {
            setLoading(false);
        }
    }

    function handleSend() {
        if (!input.trim() || loading) return;
        const msg = input.trim();
        setInput("");
        callBot(msg);
    }

    function handleButton(label: string) {
        if (loading) return;
        if (label === "Try Again") { callBot("hello", true); return; }
        setMessages(prev => [...markOld(prev), { role: "user", text: label }]);
        setShowLead(false);
        callBot(label, true);
    }

    function handleKey(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    }

    async function handleLeadSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            const res = await fetch(LEAD_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: lead.name, email: lead.email, phone: lead.phone, project: "Casagrand Project" }) });
            const data = await res.json();
            if (data.status === "success") {
                setLeadSent(true);
                setTimeout(() => { setShowLead(false); setLeadSent(false); setLead(EMPTY_LEAD); }, 2500);
            } else { alert("Failed to send lead"); }
        } catch { alert("Server error"); }
    }

    function renderText(raw: string): React.ReactElement[] {
        return raw.split("\n").map((line, i) => {
            const parts = line.split(/\*([^*]+)\*/g);
            return (
                <span key={i} style={{ display: "block", minHeight: line === "" ? "6px" : "auto" }}>
                    {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
                </span>
            );
        });
    }

    return (
        <>
            {videoModalUrl && <VideoModal url={videoModalUrl} onClose={() => setVideoModalUrl(null)} />}
            {floorPlanUnit && <FloorPlanModal unit={floorPlanUnit} onClose={() => setFloorPlanUnit(null)} />}

            {/*
        ─────────────────────────────────────────────────────────────
        OUTER WRAP
        • Desktop: centers the card on the page (non-fixed, scrollable page)
        • Mobile:  fills the full viewport with NO outer scroll —
                   only msgArea scrolls internally
        ─────────────────────────────────────────────────────────────
      */}
            <div className="cg-outer-wrap">
                <div className="cg-card">

                    {/* LEFT PANEL */}
                    <div className="cg-left-panel">
                        <video autoPlay loop muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(1.15) saturate(1.1)" }}>
                            <source src="https://cgprop.digilogy.co/assets/videos/building.mp4" type="video/mp4" />
                        </video>
                        <div style={R.leftOverlay} />
                        <div style={R.agentBadge}>
                            <div style={R.agentIcon}>
                                <svg width="20" height="20" viewBox="0 0 60 60" fill="none"><path d="M10 46V22l20-14 20 14v24H36V32H24v14H10z" fill="#fff" /><rect x="24" y="32" width="12" height="14" fill="#f59e0b" /></svg>
                            </div>
                            <div>
                                <div style={R.agentName}>CG Assistant</div>
                                <div style={R.agentStatus}><span style={R.onlineDot} />ALWAYS ONLINE</div>
                            </div>
                        </div>
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 14px 14px" }}>
                            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "2.5px", marginBottom: "8px" }}>LIVE INVENTORY</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {[{ val: totalProjects.toString(), lbl: "TOTAL PROJECTS", color: "#f59e0b" }, { val: withUnits.toString(), lbl: "WITH UNITS", color: "#34d399" }, { val: cities.toString(), lbl: "CITIES", color: "#a78bfa" }].map((s, i) => (
                                    <div key={i} style={{ flex: 1, background: "rgba(30,30,30,0.72)", backdropFilter: "blur(12px)", borderRadius: "10px", padding: "12px 8px 10px", textAlign: "center" as const, border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <div style={{ fontSize: "28px", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: "5px" }}>{s.val}</div>
                                        <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>{s.lbl}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="cg-right-panel">
                        <div style={R.chatHeader}>
                            <div style={R.chatHeaderLeft}>
                                <div style={R.chatAvatar}>
                                    <svg width="20" height="20" viewBox="0 0 60 60" fill="none"><path d="M10 46V22l20-14 20 14v24H36V32H24v14H10z" fill="#fff" /><rect x="24" y="32" width="12" height="14" fill="#f59e0b" /></svg>
                                </div>
                                <div>
                                    <div style={R.chatTitle}>Casagrand Helpdesk</div>
                                    <div style={R.chatSub}>Find your perfect home</div>
                                </div>
                            </div>
                        </div>

                        {/* msgArea — THE ONLY SCROLLABLE ZONE */}
                        <div className="cg-msg-area">
                            {messages.map((msg, i) => (
                                <div key={i} style={msg.role === "bot" ? R.botRow : R.userRow}>
                                    {msg.role === "bot" ? (
                                        <>
                                            <div style={R.botAvatar}>
                                                <svg width="14" height="14" viewBox="0 0 40 40" fill="none"><path d="M4 36V18l16-12 16 12v18H26V24H14v12H4z" fill="#fff" /></svg>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "88%", flex: 1 }}>
                                                {msg.type === "summary" && <SummaryCard msg={msg} />}
                                                {msg.type === "units" && <UnitsList msg={msg} onVideoClick={setVideoModalUrl} onFloorPlanClick={setFloorPlanUnit} onBookNow={onBookNow} />}
                                                {msg.type === "bhk_picker" && msg.isLast && <BHKPicker msg={msg} onSelect={handleButton} />}
                                                {msg.type === "bhk_picker" && !msg.isLast && <div style={R.botBubble}>{renderText(msg.text)}</div>}
                                                {(msg.type === "text" || msg.type === "lead" || !msg.type) && <div style={R.botBubble}>{renderText(msg.text)}</div>}
                                                {msg.isLast && msg.type !== "bhk_picker" && (msg.buttons?.length ?? 0) > 0 && (
                                                    <div style={R.btnGrid}>
                                                        {msg.buttons!.map((btn, bi) => (
                                                            <button key={bi} style={R.choiceBtn}
                                                                onMouseEnter={e => (e.currentTarget.style.background = "#d97706")}
                                                                onMouseLeave={e => (e.currentTarget.style.background = "#f59e0b")}
                                                                onClick={() => handleButton(btn)} disabled={loading}>{btn}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={R.userBubble}>{msg.text}</div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div style={R.botRow}>
                                    <div style={R.botAvatar}>
                                        <svg width="14" height="14" viewBox="0 0 40 40" fill="none"><path d="M4 36V18l16-12 16 12v18H26V24H14v12H4z" fill="#fff" /></svg>
                                    </div>
                                    <div style={{ ...R.botBubble, padding: "12px 16px" }}>
                                        <span style={S.dot} className="cg-dot1" />
                                        <span style={S.dot} className="cg-dot2" />
                                        <span style={S.dot} className="cg-dot3" />
                                    </div>
                                </div>
                            )}

                            {showLead && !loading && (
                                <div style={S.leadCard}>
                                    <div style={S.leadTitle}>{leadSent ? "✅ Thank you! We'll reach out soon." : "Ready to Take the Next Step?"}</div>
                                    {!leadSent && (
                                        <>
                                            <div style={S.leadSub}>Get latest prices, floor plans & availability for your selected project.</div>
                                            <form onSubmit={handleLeadSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                <input style={S.leadInput} placeholder="Your Name" value={lead.name} onChange={e => setLead(l => ({ ...l, name: e.target.value }))} required />
                                                <input style={S.leadInput} placeholder="Mobile Number" value={lead.phone} onChange={e => setLead(l => ({ ...l, phone: e.target.value }))} type="tel" required />
                                                <input style={S.leadInput} placeholder="Email Address" value={lead.email} onChange={e => setLead(l => ({ ...l, email: e.target.value }))} type="email" required />
                                                <button type="submit" style={S.leadBtn}>SUBMIT</button>
                                            </form>
                                            <button style={S.leadSkip} onClick={() => setShowLead(false)}>Skip for now</button>
                                        </>
                                    )}
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                        {/* END msgArea */}

                        <div style={R.inputArea}>
                            <input style={R.input} placeholder="Tell me what you're looking for..." value={input}
                                onChange={e => setInput(e.target.value)} onKeyDown={handleKey} disabled={loading} />
                            <button style={{ ...R.sendBtn, opacity: !input.trim() || loading ? 0.4 : 1 }} onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');

        /* ─── Reset ───────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; }

        /* ─── DESKTOP layout (≥ 768 px) ──────────────────────── */
        /*
          The widget lives inside the normal document flow.
          The page itself can scroll; the card is just centered content.
          Nothing is fixed — so it never overlaps a table below it.
        */
        .cg-outer-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 40px 20px;
          font-family: 'Outfit','Segoe UI',system-ui,sans-serif;
          background: #f0f2f8;
          /* NO min-height: 100vh — don't force the wrapper to be full screen on desktop */
        }

        .cg-card {
          display: flex;
          width: 100%;
          max-width: 1160px;
          height: 520px;          /* fixed height on desktop — content inside scrolls */
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.14);
          border: 1px solid #e4e4e4;
        }

        .cg-left-panel {
          position: relative;
          width: 42%;
          flex-shrink: 0;
          overflow: hidden;
          background: #0f0f1a;
        }

        .cg-right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #faf9f6;
          overflow: hidden;       /* right panel itself does NOT scroll */
          min-width: 0;
        }

        /* ─── Message area — THE ONLY SCROLL ZONE ─────────────── */
        .cg-msg-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: #e0ddd6 transparent;
          /* overscroll-behavior prevents scroll from bubbling to page on desktop */
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;  /* smooth momentum scroll on iOS */
        }

        /* ─── MOBILE layout (< 768 px) ────────────────────────── */
        /*
          On mobile the card occupies 100dvh exactly.
          The OUTER html/body must NOT scroll — only cg-msg-area scrolls.
        */
        @media (max-width: 767px) {
          /* Lock the page itself so it never scrolls behind the chat */
          /* Lock the page itself only when explicitly needed — handled by useEffect in component body */
          html, body {
            height: 100%;
          }

          .cg-outer-wrap {
            padding: 0;
            align-items: flex-start;
            height: auto;
            min-height: 500px;
          }

          .cg-card {
            flex-direction: column;
            height: 650px;
            max-height: 85vh;
            border-radius: 0;
            border: none;
            max-width: 100%;
          }

          .cg-left-panel {
            width: 100%;
            height: 200px;
            flex-shrink: 0;
            position: relative;
          }

          .cg-right-panel {
            flex: 1;
            min-height: 0;        /* CRITICAL: lets flexchild shrink below content size */
            /* height is whatever is left after left panel (200px) + header + input */
            overflow: hidden;
          }

          /* On mobile the msg area fills all remaining space and scrolls */
          .cg-msg-area {
            flex: 1;
            min-height: 0;        /* CRITICAL: same as above */
          }
        }

        /* ─── Animations ─────────────────────────────────────── */
        @keyframes cgDot { 0%,80%,100%{opacity:.2;transform:scale(.75)} 40%{opacity:1;transform:scale(1)} }
        .cg-dot1{animation:cgDot 1.3s ease-in-out infinite}
        .cg-dot2{animation:cgDot 1.3s ease-in-out .2s infinite}
        .cg-dot3{animation:cgDot 1.3s ease-in-out .4s infinite}
        @keyframes cgFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cgSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
        </>
    );
}

/* ─── Layout Styles ─────────────────────── */
const R: Record<string, CSSProperties> = {
    // outerWrap / card / panels moved to CSS classes above
    leftOverlay: { position: "absolute", inset: 0, background: "linear-gradient(160deg,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.05) 35%,rgba(0,0,0,0.75) 100%)" },
    agentBadge: { position: "absolute", top: "18px", left: "18px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(10px)", borderRadius: "12px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.13)" },
    agentIcon: { width: "38px", height: "38px", background: "#f59e0b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    agentName: { fontWeight: 700, fontSize: "13px", color: "#fff", letterSpacing: "0.3px" },
    agentStatus: { display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "#4ade80", fontWeight: 700, marginTop: "2px", letterSpacing: "0.8px" },
    onlineDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80" },
    chatHeader: { background: "#fff", borderBottom: "1px solid #ede9e0", padding: "14px 18px", display: "flex", alignItems: "center", flexShrink: 0 },
    chatHeaderLeft: { display: "flex", alignItems: "center", gap: "10px" },
    chatAvatar: { width: "36px", height: "36px", background: "#f59e0b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    chatTitle: { fontWeight: 700, fontSize: "14px", color: "#1a1a1a" },
    chatSub: { fontSize: "11px", color: "#aaa", marginTop: "1px" },
    botRow: { display: "flex", alignItems: "flex-start", gap: "8px", animation: "cgFadeIn .25s ease" },
    botAvatar: { width: "28px", height: "28px", borderRadius: "6px", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" },
    botBubble: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "4px 14px 14px 14px", padding: "10px 13px", fontSize: "13px", lineHeight: "1.6", color: "#222", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    userRow: { display: "flex", justifyContent: "flex-end", animation: "cgFadeIn .2s ease" },
    userBubble: { background: "#f59e0b", color: "#fff", borderRadius: "14px 14px 4px 14px", padding: "10px 14px", fontSize: "13px", fontWeight: 500, maxWidth: "75%", lineHeight: "1.5" },
    btnGrid: { display: "flex", flexWrap: "wrap" as const, gap: "6px", paddingLeft: "2px" },
    choiceBtn: { background: "#f59e0b", color: "#fff", border: "none", borderRadius: "18px", padding: "6px 13px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "background .15s", lineHeight: "1.4" },
    inputArea: { borderTop: "1px solid #ede9e0", padding: "12px 16px", display: "flex", gap: "10px", alignItems: "center", background: "#fff", flexShrink: 0 },
    input: { flex: 1, border: "1px solid #e4dfd4", borderRadius: "22px", padding: "10px 18px", fontSize: "13px", outline: "none", color: "#1a1a1a", background: "#faf9f6", fontFamily: "inherit" },
    sendBtn: { width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity .2s" },
};

const S: Record<string, CSSProperties> = {
    summaryCard: { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "12px", padding: "14px" },
    summaryTitle: { fontWeight: 700, fontSize: "15px", color: "#1a1a1a", marginBottom: "2px" },
    summaryBhk: { fontSize: "12px", color: "#888", marginBottom: "12px" },
    summaryStats: { display: "flex", gap: "8px", marginBottom: "10px" },
    statBox: { flex: 1, border: "1.5px solid #f59e0b", borderRadius: "8px", padding: "8px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
    statNum: { fontSize: "20px", fontWeight: 700, color: "#f59e0b", lineHeight: "1" },
    statLabel: { fontSize: "10px", color: "#888", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    availBar: { height: "6px", background: "#fee2e2", borderRadius: "4px", overflow: "hidden", marginBottom: "4px" },
    availFill: { height: "100%", background: "#22c55e", borderRadius: "4px", transition: "width .4s ease" },
    availLabel: { fontSize: "11px", color: "#888", textAlign: "right" as const },
    sectionLabel: { fontSize: "10px", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: "4px", marginTop: "2px" },
    unitsWrap: { background: "#fafafa", border: "1px solid #efefef", borderRadius: "12px", overflow: "hidden" },
    unitsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f59e0b" },
    unitsTitle: { fontWeight: 700, fontSize: "13px", color: "#fff" },
    unitsCount: { fontSize: "11px", color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.15)", borderRadius: "10px", padding: "2px 8px" },
    unitsSection: { fontSize: "11px", fontWeight: 700, color: "#16a34a", padding: "8px 12px 4px", background: "#f0fdf4", letterSpacing: "0.3px" },
    unitCard: { borderBottom: "1px solid #f0f0f0", background: "#fff" },
    unitHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 6px", cursor: "pointer" },
    unitNo: { fontWeight: 700, fontSize: "13px", color: "#1a1a1a" },
    unitStatus: { fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "10px" },
    unitPrice: { fontSize: "12px", fontWeight: 700, color: "#f59e0b" },
    unitQuick: { display: "flex", flexWrap: "wrap" as const, gap: "6px", padding: "0 12px 8px", fontSize: "11px", color: "#666" },
    unitExpanded: { padding: "8px 12px 10px", background: "#fafafa", borderTop: "1px dashed #eee" },
    unitRow: { display: "flex", justifyContent: "space-between", padding: "3px 0" },
    unitKey: { fontSize: "11px", color: "#888" },
    unitVal: { fontSize: "12px", color: "#1a1a1a", fontWeight: 500, textAlign: "right" as const, maxWidth: "60%" },
    dot: { display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#ccc", margin: "0 2px" },
    leadCard: { background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: "14px", padding: "16px", margin: "4px 0", boxShadow: "0 2px 12px rgba(245,158,11,.12)" },
    leadTitle: { fontWeight: 700, fontSize: "14px", color: "#f59e0b", marginBottom: "6px", textAlign: "center" as const },
    leadSub: { fontSize: "12px", color: "#666", textAlign: "center" as const, marginBottom: "12px", lineHeight: "1.5" },
    leadInput: { width: "100%", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none", color: "#1a1a1a", background: "#fafafa", boxSizing: "border-box" as const },
    leadBtn: { background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", letterSpacing: "0.5px", marginTop: "2px", width: "100%" },
    leadSkip: { background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "11px", width: "100%", textAlign: "center" as const, marginTop: "8px", padding: "4px" },
};
