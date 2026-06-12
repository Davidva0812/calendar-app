import { useState, useEffect, useMemo, useCallback } from "react";
import { loadLeaves, saveLeaves, toISO, getOnCallForDate } from "./helpers";
import {
  Avatar,
  Modal,
  LeaveForm,
  LeaveList,
  CalendarView,
  OnCallView,
  TeamView,
} from "./Components";

export default function App() {
  const [leaves, setLeaves] = useState(() => loadLeaves());
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editLeave, setEditLeave] = useState(null);
  const [prefillMember, setPrefillMember] = useState(null);

  useEffect(() => {
    saveLeaves(leaves);
  }, [leaves]);

  const handleSave = useCallback((updatedLeave) => {
    setLeaves((prev) => {
      const idx = prev.findIndex((l) => l.id === updatedLeave.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = updatedLeave;
        return next;
      }
      return [...prev, updatedLeave];
    });
  }, []);

  const handleDelete = useCallback((id) => {
    if (confirm("Delete this leave request?")) {
      setLeaves((prev) => prev.filter((l) => l.id !== id));
    }
  }, []);

  const handleStatusChange = useCallback((id, status) => {
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  }, []);

  const openNewLeave = useCallback((memberId = null) => {
    setPrefillMember(memberId);
    setEditLeave(null);
    setShowForm(true);
  }, []);

  const openEditLeave = useCallback((leave) => {
    setEditLeave(leave);
    setShowForm(true);
  }, []);

  const metrics = useMemo(() => {
    const today = toISO(new Date());
    let pending = 0;
    let approved = 0;
    let awayToday = 0;
    leaves.forEach((l) => {
      if (l.status === "pending") pending++;
      if (l.status === "approved") {
        approved++;
        if (l.start <= today && l.end >= today) awayToday++;
      }
    });
    const onCallNow = getOnCallForDate(new Date());
    return { pending, approved, awayToday, onCallNow };
  }, [leaves]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "leaves", label: "Requests", icon: "📝" },
    { id: "oncall", label: "On-Call", icon: "📞" },
    { id: "team", label: "Team", icon: "👥" },
  ];

  const activeItem =
    navItems.find((i) => i.id === activeSection) || navItems[0];

  return (
    <div className="app">
      {/* ── Sidebar (desktop) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Team Portal</h1>
          <span>Leave & On-Call Manager</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">Management</div>
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveSection(item.id);
                if (item.id === "dashboard") setActiveTab("list");
              }}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-oncall">
          <div className="sidebar-oncall-label">☎️ On Call Now</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar member={metrics.onCallNow} size={24} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {metrics.onCallNow.name}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Topbar ── */}
      <header className="mobile-topbar">
        <div>
          <div className="mobile-topbar-title">Team Portal</div>
          <div className="mobile-topbar-sub">{activeItem.label}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            On-call: {metrics.onCallNow.name}
          </span>
          <Avatar member={metrics.onCallNow} size={26} />
        </div>
      </header>

      {/* ── Main content area ── */}
      <div className="main">
        <div className="topbar">
          <div>
            <h2 className="topbar-title">{activeItem.label}</h2>
            <div className="topbar-sub">Overview and records</div>
          </div>
          <button className="btn btn-primary" onClick={() => openNewLeave()}>
            ➕ New Request
          </button>
        </div>

        <div className="content">
          {activeSection === "dashboard" && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--amber)" }}>
                    {metrics.pending}
                  </div>
                  <div className="stat-label">Pending Reviews</div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-value"
                    style={{ color: "var(--emerald)" }}
                  >
                    {metrics.approved}
                  </div>
                  <div className="stat-label">Approved Leaves</div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-value"
                    style={{
                      color:
                        metrics.awayToday > 0
                          ? "var(--rose)"
                          : "var(--text-muted)",
                    }}
                  >
                    {metrics.awayToday}
                  </div>
                  <div className="stat-label">Away Today</div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-value"
                    style={{ color: metrics.onCallNow.color }}
                  >
                    {metrics.onCallNow.name}
                  </div>
                  <div className="stat-label">Current On-Call</div>
                </div>
              </div>

              <div className="tabs">
                <div
                  className={`tab ${activeTab === "list" ? "active" : ""}`}
                  onClick={() => setActiveTab("list")}
                >
                  Recent Requests
                </div>
                <div
                  className={`tab ${activeTab === "calendar" ? "active" : ""}`}
                  onClick={() => setActiveTab("calendar")}
                >
                  Calendar View
                </div>
              </div>

              {activeTab === "list" && (
                <div className="dash-cards">
                  <div className="card">
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 14,
                      }}
                    >
                      Latest Updates
                    </h3>
                    <LeaveList
                      leaves={leaves}
                      onEdit={openEditLeave}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  </div>
                  <div className="card">
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 14,
                      }}
                    >
                      Team Availability
                    </h3>
                    <TeamView leaves={leaves} onNewLeave={openNewLeave} />
                  </div>
                </div>
              )}
              {activeTab === "calendar" && <CalendarView leaves={leaves} />}
            </>
          )}

          {activeSection === "leaves" && (
            <>
              <div className="tabs">
                <div
                  className={`tab ${activeTab === "list" ? "active" : ""}`}
                  onClick={() => setActiveTab("list")}
                >
                  List View
                </div>
                <div
                  className={`tab ${activeTab === "calendar" ? "active" : ""}`}
                  onClick={() => setActiveTab("calendar")}
                >
                  Calendar Grid
                </div>
              </div>
              {activeTab === "list" && (
                <LeaveList
                  leaves={leaves}
                  onEdit={openEditLeave}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              )}
              {activeTab === "calendar" && <CalendarView leaves={leaves} />}
            </>
          )}

          {activeSection === "oncall" && <OnCallView leaves={leaves} />}
          {activeSection === "team" && (
            <TeamView leaves={leaves} onNewLeave={openNewLeave} />
          )}
        </div>
      </div>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`bottom-nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="bn-icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* ── FAB (mobile) ── */}
      <button
        className="fab"
        onClick={() => openNewLeave()}
        title="New leave request"
      >
        ＋
      </button>

      {/* ── Modal ── */}
      {showForm && (
        <Modal
          title={editLeave ? "Edit leave request" : "New leave request"}
          onClose={() => {
            setShowForm(false);
            setEditLeave(null);
          }}
        >
          <LeaveForm
            leaves={leaves}
            onSave={handleSave}
            onClose={() => {
              setShowForm(false);
              setEditLeave(null);
            }}
            editLeave={editLeave}
            prefillMember={prefillMember}
          />
        </Modal>
      )}
    </div>
  );
}
