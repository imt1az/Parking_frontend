"use client";

import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchPanel from "../../components/SearchPanel";
import BookingsList from "../../components/BookingsList";
import { api, session } from "../../../lib/api";

export default function DriverPage() {
  const [auth, setAuth] = useState(() => session.get());
  const [searchForm, setSearchForm] = useState({
    lat: "",
    lng: "",
    start_ts: "",
    end_ts: "",
    radius_m: 1500,
  });
  const [results, setResults] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (auth.token) loadBookings();
  }, [auth.token]);

  const toast = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  };

  const loadBookings = async () => {
    try {
      const res = await api.myBookings(auth.token);
      setBookings(res.data || res || []);
    } catch (e) {
      toast(e.message);
    }
  };

  const doSearch = async () => {
    try {
      const res = await api.search(searchForm);
      setResults(res.items || []);
      toast(`Found ${res.count} spaces`);
    } catch (e) {
      toast(e.message);
    }
  };

  const bookSpace = async (spaceId) => {
    try {
      const res = await api.createBooking(
        {
          space_id: spaceId,
          start_ts: searchForm.start_ts,
          end_ts: searchForm.end_ts,
        },
        auth.token
      );
      toast("Booked");
      setBookings([res, ...bookings]);
    } catch (e) {
      toast(e.message);
    }
  };

  const cancelBooking = async (id) => {
    try {
      await api.bookingAction(id, "cancel", auth.token);
      toast("Cancelled");
      loadBookings();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card className="hero">
        <div className="badge">Driver</div>
        <h2 className="section-title">Search & book nearest parking</h2>
        <p className="muted">Location, time window দিয়ে খুঁজুন; সঙ্গে সঙ্গেই বুক করুন।</p>
      </Card>

      {flash && <Card style={{ borderColor: "var(--accent)" }}>{flash}</Card>}

      <div className="grid two">
        <SearchPanel
          form={searchForm}
          onChange={setSearchForm}
          onSearch={doSearch}
          results={results}
          onBook={bookSpace}
          role="driver"
        />

        <BookingsList
          title="My Bookings"
          bookings={bookings}
          role="driver"
          onRefresh={loadBookings}
          actions={(b) =>
            ["reserved", "confirmed"].includes(b.status) ? (
              <Button variant="ghost" onClick={() => cancelBooking(b.id)}>
                Cancel
              </Button>
            ) : null
          }
        />
      </div>
    </div>
  );
}
