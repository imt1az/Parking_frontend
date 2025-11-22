"use client";

import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SpaceForm from "../../components/SpaceForm";
import AvailabilityForm from "../../components/AvailabilityForm";
import SpacesList from "../../components/SpacesList";
import ProviderBookings from "../../components/ProviderBookings";
import { api, session } from "../../../lib/api";

export default function ProviderPage() {
  const [auth] = useState(() => session.get());
  const [spaces, setSpaces] = useState([]);
  const [spaceForm, setSpaceForm] = useState({
    title: "",
    description: "",
    address: "",
    lat: "",
    lng: "",
    capacity: 1,
    height_limit: "",
    is_active: true,
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    space_id: "",
    start_ts: "",
    end_ts: "",
    base_price_per_hour: "",
    is_active: true,
  });
  const [bookings, setBookings] = useState([]);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (auth.token) {
      loadSpaces();
      loadBookings();
    }
  }, [auth.token]);

  const toast = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
  };

  const loadSpaces = async () => {
    try {
      const res = await api.mySpaces(auth.token);
      setSpaces(res.data || res || []);
    } catch (e) {
      toast(e.message);
    }
  };

  const createSpace = async () => {
    try {
      const payload = {
        ...spaceForm,
        capacity: Number(spaceForm.capacity || 1),
        height_limit: spaceForm.height_limit ? Number(spaceForm.height_limit) : null,
      };
      const res = await api.createSpace(payload, auth.token);
      setSpaces([res, ...spaces]);
      toast("Space created");
    } catch (e) {
      toast(e.message);
    }
  };

  const addAvailability = async () => {
    try {
      const { space_id, ...rest } = availabilityForm;
      await api.addAvailability(space_id, rest, auth.token);
      toast("Availability added");
      setAvailabilityForm({
        space_id: "",
        start_ts: "",
        end_ts: "",
        base_price_per_hour: "",
        is_active: true,
      });
      loadSpaces();
    } catch (e) {
      toast(e.message);
    }
  };

  const loadBookings = async () => {
    try {
      const res = await api.bookingsForSpaces(auth.token);
      setBookings(res.data || res || []);
    } catch (e) {
      toast(e.message);
    }
  };

  const act = async (id, action) => {
    try {
      await api.bookingAction(id, action, auth.token);
      toast(`Booking ${action}`);
      loadBookings();
    } catch (e) {
      toast(e.message);
    }
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card className="hero">
        <div className="badge">Provider</div>
        <h2 className="section-title">স্পেস ও বুকিং পরিচালনা</h2>
        <p className="muted">স্পেস তৈরি করুন, অ্যাভেইলেবিলিটি সেট করুন, বুকিং কনফার্ম/চেক-ইন/আউট করুন।</p>
      </Card>

      {flash && <Card style={{ borderColor: "var(--accent)" }}>{flash}</Card>}

      <div className="grid two">
        <SpaceForm form={spaceForm} onChange={setSpaceForm} onSubmit={createSpace} />
        <AvailabilityForm
          form={availabilityForm}
          onChange={setAvailabilityForm}
          onSubmit={addAvailability}
        />
      </div>

      <ProviderBookings
        bookings={bookings}
        onRefresh={loadBookings}
        actions={(b) => (
          <div className="row">
            {b.status === "reserved" && (
              <Button onClick={() => act(b.id, "confirm")}>Confirm</Button>
            )}
            {["reserved", "confirmed"].includes(b.status) && (
              <Button variant="ghost" onClick={() => act(b.id, "cancel")}>
                Cancel
              </Button>
            )}
            {b.status === "confirmed" && (
              <Button onClick={() => act(b.id, "check-in")}>Check-in</Button>
            )}
            {b.status === "checked_in" && (
              <Button onClick={() => act(b.id, "check-out")}>Check-out</Button>
            )}
          </div>
        )}
        role="provider"
      />

      <SpacesList spaces={spaces} onRefresh={loadSpaces} />
    </div>
  );
}
