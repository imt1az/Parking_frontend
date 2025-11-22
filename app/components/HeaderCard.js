"use client";

export default function HeaderCard({ authed, user, role, onLogout }) {
  return (
    <header className="glass card shadow-ring hero">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="badge">Parking Portal</div>
          <h1 className="title">একই জায়গায় বুকিং, স্পেস ম্যানেজমেন্ট ও অপারেশন</h1>
          <p className="muted" style={{ maxWidth: 720 }}>
            Driver / Provider / Admin — সব রোলের জন্য একীভূত UI। লগইন করে স্পেস তৈরি, অ্যাভেইলেবিলিটি সেট, সার্চ ও বুকিং চালান।
          </p>
        </div>
        <div className="glass card" style={{ minWidth: 240, textAlign: "right" }}>
          <div className="pill" style={{ float: "right" }}>
            {authed ? (
              <>
                <span>Signed in</span>
                <strong>{user?.name}</strong>
                <span className="chip">{role}</span>
              </>
            ) : (
              <span>Guest</span>
            )}
          </div>
          {authed && (
            <div style={{ marginTop: 40 }}>
              <button className="btn btn-ghost" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
