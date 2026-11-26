"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, Bell, Check, ChevronDown, CircleHelp, Clock3, Link2, LockKeyhole, LogOut, Plus, Search, Settings2, ShieldCheck, Users, Video, X } from "lucide-react";

type Account = { slot: number; name: string; email: string; status: "Not connected" | "Connected" | "Token expired" };
const initialAccounts: Account[] = Array.from({ length: 60 }, (_, i) => ({ slot: i + 1, name: `Zoom Account ${String(i + 1).padStart(2, "0")}`, email: "Not authorized", status: "Not connected" }));

export default function Dashboard() {
  const [accounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All accounts");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [meetingPassword, setMeetingPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const filtered = useMemo(() => accounts.filter((a) => {
    const matchesSearch = `${a.name} ${a.email} ${a.slot}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All accounts" || (filter === "Connected" ? a.status === "Connected" : a.status !== "Connected");
    return matchesSearch && matchesFilter;
  }), [accounts, search, filter]);

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Video size={21}/></div><div><strong>ZoomHub <span>60</span></strong><small>ACCOUNT CONTROL CENTER</small></div></div>
      <div className="workspace"><div className="workspace-icon">ZH</div><div><b>Workspace</b><small>Administrator</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <a className="nav-item active"><Activity size={17}/> Overview</a>
      <a className="nav-item"><Users size={17}/> Account Profiles <span className="nav-count">60</span></a>
      <a className="nav-item"><Video size={17}/> Meeting Settings</a>
      <a className="nav-item"><Clock3 size={17}/> Activity Logs</a>
      <div className="nav-label space-top">PREFERENCES</div>
      <a className="nav-item"><Settings2 size={17}/> Settings</a>
      <a className="nav-item"><CircleHelp size={17}/> Help & Support</a>
      <div className="sidebar-bottom"><div className="secure"><ShieldCheck size={17}/><div><b>Secure workspace</b><small>Account tokens stay protected</small></div></div><div className="user-row"><div className="avatar">AD</div><div><b>Administrator</b><small>Workspace owner</small></div><LogOut size={16}/></div></div>
    </aside>

    <section className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="env"><i/> Development</span><button className="icon-btn" aria-label="Notifications"><Bell size={18}/></button><div className="avatar small">AD</div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow">ACCOUNT OPERATIONS</div><h1>Overview</h1><p>Manage your authorized Zoom account connections from one place.</p></div><button className="primary-btn" onClick={() => document.getElementById("meeting-settings")?.scrollIntoView({ behavior: "smooth" })}><Plus size={16}/> Configure meeting</button></div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Total profiles</span><div className="stat-icon purple"><Users size={18}/></div></div><strong>60</strong><small>Available account slots</small></div>
          <div className="stat-card"><div className="stat-top"><span>Connected accounts</span><div className="stat-icon green"><Check size={18}/></div></div><strong>0</strong><small>Authorized Zoom accounts</small></div>
          <div className="stat-card"><div className="stat-top"><span>Not connected</span><div className="stat-icon amber"><Clock3 size={18}/></div></div><strong>60</strong><small>Awaiting account authorization</small></div>
          <div className="stat-card"><div className="stat-top"><span>Meeting configuration</span><div className="stat-icon blue"><Link2 size={18}/></div></div><strong className="stat-word">Not set</strong><small>Central meeting details</small></div>
        </div>

        <section className="panel meeting-panel" id="meeting-settings">
          <div className="panel-heading"><div><div className="section-icon"><Video size={18}/></div><div><h2>Central meeting configuration</h2><p>Enter meeting details once. They are shared as reference data across the workspace.</p></div></div><span className="central-tag"><LockKeyhole size={13}/> CENTRALIZED</span></div>
          <div className="meeting-form">
            <label className="field wide"><span>Meeting link</span><input value={meetingLink} onChange={e => {setMeetingLink(e.target.value);setSaved(false)}} placeholder="https://zoom.us/j/123456789" /></label>
            <label className="field"><span>Meeting ID</span><input value={meetingId} onChange={e => {setMeetingId(e.target.value);setSaved(false)}} placeholder="Enter meeting ID" /></label>
            <label className="field"><span>Meeting password</span><div className="password-wrap"><input type={showPassword ? "text" : "password"} value={meetingPassword} onChange={e => {setMeetingPassword(e.target.value);setSaved(false)}} placeholder="Enter meeting password"/><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label>
          </div>
          <div className="panel-footer"><span className="muted-note"><LockKeyhole size={14}/> Production version will encrypt the password at rest.</span><button className="secondary-btn" onClick={() => setSaved(true)}><Check size={15}/> {saved ? "Saved in this demo" : "Save configuration"}</button></div>
          <div className="demo-warning">Prototype only: this form currently stores values in page state, not in a database. Do not enter a real meeting password yet.</div>
        </section>

        <section className="panel accounts-panel">
          <div className="accounts-heading"><div><h2>Account profiles <span className="count-pill">60</span></h2><p>Each profile requires its own authorized Zoom account connection.</p></div><button className="outline-btn" disabled title="Bulk authorization will be designed after OAuth is implemented"><Plus size={15}/> Add account</button></div>
          <div className="toolbar"><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search account profiles..."/></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>All accounts</option><option>Connected</option><option>Not connected</option></select><span className="result-count">Showing {filtered.length} of 60</span></div>
          <div className="account-grid">{filtered.map(a => <article className="account-card" key={a.slot}><div className="account-card-top"><div className="account-avatar">{String(a.slot).padStart(2,"0")}</div><span className="status-dot"><i/> Not connected</span></div><h3>{a.name}</h3><p className="account-email">Not authorized yet</p><div className="account-divider"/><div className="account-meta"><span>Meeting settings</span><b>{meetingId ? `ID ••••${meetingId.slice(-4)}` : "Not configured"}</b></div><button className="connect-btn" disabled title="Zoom OAuth connection will be implemented in the next phase">Connect Zoom account <ArrowUpRight size={14}/></button></article>)}</div>
          {filtered.length === 0 && <div className="empty-state">No profiles match your search.</div>}
        </section>
        <footer className="footer"><span>ZoomHub 60 <span className="dot-sep">•</span> Development build v0.1.0</span><span>Authorized account management only</span></footer>
      </div>
    </section>
  </main>;
}
