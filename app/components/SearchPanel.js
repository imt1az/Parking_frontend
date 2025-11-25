"use client";

export default function SearchPanel({
  form,
  onChange,
  onSearch,
  results,
  onBook,
  role,
}) {
  return (
    <div className="glass card">
      <div className="pill">Search & Book</div>
      <h3 className="section-title">লোকেশন ভিত্তিক সার্চ</h3>
      <div className="grid" style={{ gap: 10 }}>
        <div className="row">
          <div style={{ flex: 1 }}>
            <div className="label">Latitude</div>
            <input
              className="input"
              value={form.lat}
              onChange={(e) => onChange({ ...form, lat: e.target.value })}
              placeholder="23.78"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">Longitude</div>
            <input
              className="input"
              value={form.lng}
              onChange={(e) => onChange({ ...form, lng: e.target.value })}
              placeholder="90.41"
            />
          </div>
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <div className="label">Start</div>
            <input
              className="input"
              type="datetime-local"
              value={form.start_ts}
              onChange={(e) => onChange({ ...form, start_ts: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="label">End</div>
            <input
              className="input"
              type="datetime-local"
              value={form.end_ts}
              onChange={(e) => onChange({ ...form, end_ts: e.target.value })}
            />
          </div>
        </div>
        <div>
          <div className="label">Radius (m)</div>
          <input
            className="input"
            type="number"
            value={form.radius_m}
            onChange={(e) => onChange({ ...form, radius_m: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" onClick={onSearch}>
          Search
        </button>
      </div>
      <div className="divider" />
      <div className="list">
        {results.length === 0 && <div className="muted">No results yet</div>}
        {results.map((s) => (
          <div key={s.id} className="glass card" style={{ borderColor: "var(--border)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{s.title}</strong>
                <div className="muted">{s.address}</div>
                <div className="chip">Distance: {(s.distance_m / 1000).toFixed(2)} km</div>
              </div>
              <div className="row">
                <div className="chip">Capacity: {s.capacity}</div>
                <button
                  className="btn btn-primary"
                  onClick={() => onBook(s.id)}
                  disabled={role !== "driver"}
                  title={role !== "driver" ? "Only drivers can book" : ""}
                >
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
