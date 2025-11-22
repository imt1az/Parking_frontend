"use client";

export default function AvailabilityForm({ form, onChange, onSubmit }) {
  return (
    <div className="glass card">
      <div className="pill">Availability</div>
      <h3 className="section-title">অ্যাভেইলেবিলিটি সেট</h3>
      <div className="grid" style={{ gap: 10 }}>
        <div>
          <div className="label">Space ID</div>
          <input
            className="input"
            value={form.space_id}
            onChange={(e) => onChange({ ...form, space_id: e.target.value })}
            placeholder="e.g. 1"
          />
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <div className="label">Start</div>
            <input
              type="datetime-local"
              className="input"
              value={form.start_ts}
              onChange={(e) => onChange({ ...form, start_ts: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">End</div>
            <input
              type="datetime-local"
              className="input"
              value={form.end_ts}
              onChange={(e) => onChange({ ...form, end_ts: e.target.value })}
            />
          </div>
        </div>
        <div>
          <div className="label">Base price per hour</div>
          <input
            type="number"
            className="input"
            value={form.base_price_per_hour}
            onChange={(e) => onChange({ ...form, base_price_per_hour: e.target.value })}
          />
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <label className="row" style={{ gap: 8 }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
            />
            <span className="muted">Active</span>
          </label>
          <button className="btn btn-primary" onClick={onSubmit}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
