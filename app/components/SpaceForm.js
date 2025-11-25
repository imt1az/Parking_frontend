"use client";

export default function SpaceForm({ form, onChange, onSubmit }) {
  return (
    <div className="glass card">
      <div className="pill">Provider / Admin</div>
      <h3 className="section-title">নতুন স্পেস তৈরি</h3>
      <div className="grid" style={{ gap: 10 }}>
        <div>
          <div className="label">Title</div>
          <input
            className="input"
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <div className="label">Description</div>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <div className="label">Address</div>
          <input
            className="input"
            value={form.address}
            onChange={(e) => onChange({ ...form, address: e.target.value })}
          />
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <div className="label">Lat</div>
            <input
              className="input"
              value={form.lat}
              onChange={(e) => onChange({ ...form, lat: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">Lng</div>
            <input
              className="input"
              value={form.lng}
              onChange={(e) => onChange({ ...form, lng: e.target.value })}
            />
          </div>
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <div className="label">Capacity</div>
            <input
              className="input"
              type="number"
              value={form.capacity}
              onChange={(e) => onChange({ ...form, capacity: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">Height limit (m)</div>
            <input
              className="input"
              type="number"
              value={form.height_limit}
              onChange={(e) => onChange({ ...form, height_limit: e.target.value })}
            />
          </div>
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
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
