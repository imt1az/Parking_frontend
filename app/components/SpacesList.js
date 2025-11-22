"use client";

export default function SpacesList({ spaces, onRefresh }) {
  return (
    <section className="glass card" style={{ marginTop: 18 }}>
      <div className="pill">My Spaces</div>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <h3 className="section-title">স্পেস তালিকা</h3>
        <button className="btn btn-ghost" onClick={onRefresh}>
          Refresh
        </button>
      </div>
      <div className="list">
        {spaces.length === 0 && <div className="muted">No spaces</div>}
        {spaces.map((s) => (
          <div key={s.id} className="glass card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{s.title}</strong>{" "}
                <span className="chip">{s.is_active ? "Active" : "Inactive"}</span>
                <div className="muted">{s.address}</div>
                <div className="chip">Cap: {s.capacity}</div>
              </div>
              <div className="muted">
                Lat/Lng: {s.lat}, {s.lng}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
