"use client";

export default function BookingsList({ title, bookings, role, onRefresh, actions }) {
  return (
    <div className="glass card">
      <div className="pill">{title}</div>
      <h3 className="section-title">আপনার বুকিং</h3>
      <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={onRefresh}>
        Refresh
      </button>
      <div className="list">
        {bookings.length === 0 && <div className="muted">No bookings</div>}
        {bookings.map((b) => (
          <div key={b.id} className="glass card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>#{b.id}</strong> — {b.space?.title || b.space_id}
                <div className={`status ${b.status}`}>{b.status}</div>
                <div className="muted">
                  {b.start_ts} → {b.end_ts}
                </div>
                <div className="chip">৳ {b.price_total}</div>
              </div>
              <div>{actions(b, role)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
