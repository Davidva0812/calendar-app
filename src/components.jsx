import { useState, useEffect, useMemo } from "react";
import {
  TEAM,
  STATUSES,
  toISO,
  fromISO,
  formatDate,
  formatDateShort,
  isSameDay,
  dateRange,
  datesOverlap,
  getWeekIndex,
  getWeekMonday,
  getWeekSunday,
  getOnCallForDate,
  getOnCallForWeek,
} from "./helpers";

// ─── Avatar Component ─────────────────────────────────────────────────────────
export function Avatar({ member, size = 32 }) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: member.color + "22",
        border: `2px solid ${member.color}44`,
        color: member.color,
        fontSize: size * 0.35,
      }}
    >
      {member.initials}
    </div>
  );
}

// ─── Modal Component ──────────────────────────────────────────────────────────
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Leave Form Component ─────────────────────────────────────────────────────
export function LeaveForm({
  leaves,
  onSave,
  onClose,
  editLeave = null,
  prefillMember = null,
}) {
  const todayISO = toISO(new Date());
  const [form, setForm] = useState(
    editLeave
      ? {
          memberId: editLeave.memberId,
          start: editLeave.start,
          end: editLeave.end,
          reason: editLeave.reason,
          status: editLeave.status,
        }
      : {
          memberId: prefillMember || TEAM[0].id,
          start: todayISO,
          end: todayISO,
          reason: "",
          status: "pending",
        },
  );
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.start) e.start = "Start date required";
    if (!form.end) e.end = "End date required";
    if (form.start && form.end && form.end < form.start)
      e.end = "End must be ≥ start";
    if (!form.reason.trim()) e.reason = "Reason required";
    const ov = leaves.find((l) => {
      if (editLeave && l.id === editLeave.id) return false;
      if (l.memberId !== form.memberId) return false;
      return datesOverlap(form.start, form.end, l.start, l.end);
    });
    if (ov)
      e.overlap = `Overlaps with existing request (${formatDateShort(ov.start)} – ${formatDateShort(ov.end)})`;
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onSave({
      id: editLeave ? editLeave.id : "l" + Date.now(),
      ...form,
      reason: form.reason.trim(),
    });
    onClose();
  }

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined, overlap: undefined }));
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label">Team member</label>
        <select
          className="form-select"
          value={form.memberId}
          onChange={(e) => set("memberId", e.target.value)}
        >
          {TEAM.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start date</label>
          <input
            className="form-input"
            type="date"
            value={form.start}
            onChange={(e) => set("start", e.target.value)}
          />
          {errors.start && <div className="form-error">{errors.start}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">End date</label>
          <input
            className="form-input"
            type="date"
            value={form.end}
            onChange={(e) => set("end", e.target.value)}
          />
          {errors.end && <div className="form-error">{errors.end}</div>}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Reason</label>
        <textarea
          className="form-textarea"
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          placeholder="Brief description…"
        />
        {errors.reason && <div className="form-error">{errors.reason}</div>}
      </div>
      {editLeave && (
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}
      {errors.overlap && (
        <div
          style={{
            background: "rgba(244,63,94,0.1)",
            border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: 6,
            padding: "8px 12px",
            marginBottom: 12,
            color: "var(--rose)",
            fontSize: 12,
          }}
        >
          ⚠ {errors.overlap}
        </div>
      )}
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {editLeave ? "Save changes" : "Submit request"}
        </button>
      </div>
    </>
  );
}

// ─── Leave List Component ─────────────────────────────────────────────────────
export function LeaveList({ leaves, onEdit, onDelete, onStatusChange }) {
  const [filterMember, setFilterMember] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = leaves
    .filter((l) => {
      if (filterMember && l.memberId !== filterMember) return false;
      if (filterStatus && l.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => (a.start < b.start ? 1 : -1));

  return (
    <div>
      <div className="filter-bar">
        <select
          className="form-select"
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
        >
          <option value="">All members</option>
          {TEAM.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {(filterMember || filterStatus) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setFilterMember("");
              setFilterStatus("");
            }}
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>No leave requests found</p>
        </div>
      ) : (
        <>
          <div className="table-wrap table-desktop">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((leave) => {
                  const member = TEAM.find((m) => m.id === leave.memberId);
                  const days = dateRange(leave.start, leave.end).length;
                  return (
                    <tr key={leave.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Avatar member={member} size={28} />
                          <span style={{ fontWeight: 500 }}>{member.name}</span>
                        </div>
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatDate(leave.start)}
                      </td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatDate(leave.end)}
                      </td>
                      <td>
                        <span style={{ color: "var(--text-muted)" }}>
                          {days}d
                        </span>
                      </td>
                      <td style={{ maxWidth: 180 }}>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {leave.reason}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{
                            width: 110,
                            padding: "3px 8px",
                            fontSize: 12,
                          }}
                          value={leave.status}
                          onChange={(e) =>
                            onStatusChange(leave.id, e.target.value)
                          }
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => onEdit(leave)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onDelete(leave.id)}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-list">
            {filtered.map((leave) => {
              const member = TEAM.find((m) => m.id === leave.memberId);
              const days = dateRange(leave.start, leave.end).length;
              return (
                <div key={leave.id} className="leave-card">
                  <div className="leave-card-header">
                    <div className="leave-card-member">
                      <Avatar member={member} size={30} />
                      <span style={{ fontWeight: 600 }}>{member.name}</span>
                    </div>
                    <span className={`badge badge-${leave.status}`}>
                      {leave.status.charAt(0).toUpperCase() +
                        leave.status.slice(1)}
                    </span>
                  </div>
                  <div className="leave-card-dates">
                    📅 {formatDateShort(leave.start)} –{" "}
                    {formatDateShort(leave.end)} · {days}d
                  </div>
                  <div className="leave-card-reason">{leave.reason}</div>
                  <div className="leave-card-footer">
                    <select
                      className="form-select"
                      style={{ flex: 1, fontSize: 12, padding: "5px 8px" }}
                      value={leave.status}
                      onChange={(e) => onStatusChange(leave.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onEdit(leave)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(leave.id)}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Calendar View Component ──────────────────────────────────────────────────
export function CalendarView({ leaves }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const onCallConflicts = useMemo(() => {
    const conflicts = {};
    leaves.forEach((l) => {
      if (l.status !== "approved") return;
      dateRange(l.start, l.end).forEach((dStr) => {
        const d = fromISO(dStr);
        if (getOnCallForDate(d).id === l.memberId) {
          conflicts[dStr] = true;
        }
      });
    });
    return conflicts;
  }, [leaves]);

  const cells = useMemo(() => {
    const list = [];
    const firstMon = getWeekMonday(new Date(year, month, 1));
    const lastSun = getWeekSunday(new Date(year, month + 1, 0));
    const cur = new Date(firstMon);

    while (cur <= lastSun) {
      const iso = toISO(cur);
      const dayLeaves = leaves.filter((l) =>
        datesOverlap(l.start, l.end, iso, iso),
      );
      list.push({
        date: new Date(cur),
        iso,
        isOtherMonth: cur.getMonth() !== month,
        isToday: isSameDay(cur, new Date()),
        onCall: getOnCallForDate(cur),
        hasOnCallConflict: !!onCallConflicts[iso],
        events: dayLeaves.map((l) => ({
          id: l.id,
          status: l.status,
          label: `${TEAM.find((m) => m.id === l.memberId)?.name || "?"}: ${l.reason}`,
        })),
      });
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  }, [year, month, leaves, onCallConflicts]);

  const monthLabel = viewDate.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card">
      <div className="cal-nav">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
        >
          ◀
        </button>
        <h3>{monthLabel}</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setViewDate(new Date())}
        >
          Today
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
        >
          ▶
        </button>
      </div>
      <div className="cal-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((h) => (
          <div key={h} className="cal-header-cell">
            {h}
          </div>
        ))}
        {cells.map((c) => (
          <div
            key={c.iso}
            className={`cal-cell ${c.isOtherMonth ? "other-month" : ""} ${c.isToday ? "today" : ""}`}
          >
            <div className="cal-day-num">{c.date.getDate()}</div>
            <div
              className={`cal-oncall ${c.hasOnCallConflict ? "conflict" : ""}`}
              title={`On-call: ${c.onCall.name}${c.hasOnCallConflict ? " (Conflict!)" : ""}`}
            >
              {c.onCall.initials}
            </div>
            <div style={{ marginTop: 4 }}>
              {c.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`cal-event cal-event-${ev.status}`}
                  title={ev.label}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OnCall View Component ────────────────────────────────────────────────────
export function OnCallView({ leaves }) {
  const weeks = useMemo(() => {
    const list = [];
    const today = new Date();
    const curMon = getWeekMonday(today);

    for (let i = -1; i < 7; i++) {
      const mon = new Date(curMon);
      mon.setDate(curMon.getDate() + i * 7);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);

      const wi = getWeekIndex(mon);
      const person = getOnCallForWeek(wi);
      const sISO = toISO(mon);
      const eISO = toISO(sun);

      const conflict = leaves.find(
        (l) =>
          l.status === "approved" &&
          l.memberId === person.id &&
          datesOverlap(l.start, l.end, sISO, eISO),
      );

      list.push({
        wi,
        person,
        mon,
        sun,
        isCurrent: i === 0,
        conflictMsg: conflict
          ? `Conflict: Leave (${formatDateShort(conflict.start)}–${formatDateShort(conflict.end)})`
          : null,
      });
    }
    return list;
  }, [leaves]);

  return (
    <div>
      <div className="oncall-strip">
        {weeks.map((w) => (
          <div
            key={w.wi}
            className={`oncall-week ${w.isCurrent ? "current" : ""} ${w.conflictMsg ? "conflict" : ""}`}
          >
            <div className="oncall-week-label">
              {w.isCurrent ? "⚠️ This Week" : `Week ${w.wi}`}
            </div>
            <div className="oncall-person" style={{ color: w.person.color }}>
              {w.person.name}
            </div>
            <div className="oncall-dates">
              {formatDateShort(toISO(w.mon))} – {formatDateShort(toISO(w.sun))}
            </div>
            {w.conflictMsg && (
              <div className="oncall-conflict-msg">⚠️ {w.conflictMsg}</div>
            )}
          </div>
        ))}
      </div>
      <CalendarView leaves={leaves} />
    </div>
  );
}

// ─── Team View Component ──────────────────────────────────────────────────────
export function TeamView({ leaves, onNewLeave }) {
  const stats = useMemo(() => {
    const today = toISO(new Date());
    const m = {};
    TEAM.forEach((t) => {
      m[t.id] = { approved: 0, pending: 0, isAway: false };
    });
    leaves.forEach((l) => {
      if (!m[l.memberId]) return;
      if (l.status === "approved") {
        m[l.memberId].approved += dateRange(l.start, l.end).length;
        if (l.start <= today && l.end >= today) m[l.memberId].isAway = true;
      } else if (l.status === "pending") {
        m[l.memberId].pending += dateRange(l.start, l.end).length;
      }
    });
    return m;
  }, [leaves]);

  return (
    <div className="members-grid">
      {TEAM.map((m) => {
        const s = stats[m.id];
        return (
          <div key={m.id} className="member-card">
            <Avatar member={m} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="member-name">{m.name}</div>
              <div className="member-sub">
                {s.isAway ? (
                  <span style={{ color: "var(--rose)", fontWeight: 500 }}>
                    🔴 Away Today
                  </span>
                ) : (
                  <span style={{ color: "var(--emerald)" }}>🟢 Available</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                Approved: {s.approved}d{" "}
                {s.pending > 0 && `(${s.pending}d pending)`}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNewLeave(m.id)}
              title="Request leave"
            >
              +
            </button>
          </div>
        );
      })}
    </div>
  );
}
