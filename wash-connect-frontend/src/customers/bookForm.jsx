import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, Mail, Calendar, MapPin } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Helpers
const placeholderImg = "https://via.placeholder.com/160?text=Service";
const normalizeImg = (raw) => {
  if (!raw) return placeholderImg;
  return String(raw).startsWith("http")
    ? raw
    : `http://localhost:3000/${String(raw).replace(/^\/?/, "")}`;
};

function BookForm() {
  const navigate = useNavigate();
  const location = useLocation();

  // Passed from BookingPage
  const carwashName = location.state?.carwashName || "Carwash";
  const applicationId =
    location.state?.applicationId ||
    localStorage.getItem("selectedApplicationId") ||
    "";
  const selectedServiceName = location.state?.serviceName || "Selected Service";
  const statePrice = location.state?.servicePrice ?? null;
  const stateImg = location.state?.serviceImg ?? null;

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    date: "",
    time: "",
    message: "",
    vehicleModel: "",      // NEW
  });
  const [submitting, setSubmitting] = useState(false);

  // Vehicle type enum: Car or Motorcycle
  const [vehicleType, setVehicleType] = useState("Motorcycle");

  // Data
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("");
  const [fetchedServices, setFetchedServices] = useState([]);
  const [unavailablePersonnelIds, setUnavailablePersonnelIds] = useState([]);
  // Check if the booking is completed and paid (after booking is made)
  const [bookingStatus, setBookingStatus] = useState({ completed: false, paid: false });

  // Prefill from navigation state (user profile info)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      firstName: location.state?.firstName || "",
      lastName: location.state?.lastName || "",
      email: location.state?.email || "",
      address: location.state?.address || "",
    }));
  }, [location.state]);

  // Fetch personnel (via application -> owner -> personnel)
  useEffect(() => {
    async function fetchPersonnel() {
      if (!applicationId || !selectedServiceName) {
        setPersonnelList([]);
        return;
      }
      try {
        // 1. Get carwash application by ID to find ownerId
        const appRes = await fetch(`http://localhost:3000/api/carwash-applications/by-application/${applicationId}`);
        const appData = await appRes.json();
        const ownerId = appData.ownerId;
        if (!ownerId) {
          setPersonnelList([]);
          return;
        }
        // 2. Fetch personnel by ownerId and role
        const personnelRes = await fetch(
          `http://localhost:3000/api/personnel/by-owner/${ownerId}?role=${encodeURIComponent(selectedServiceName)}`
        );
        const personnelData = await personnelRes.json();
        setPersonnelList(Array.isArray(personnelData) ? personnelData : []);
      } catch {
        setPersonnelList([]);
      }
    }
    fetchPersonnel();
  }, [applicationId, selectedServiceName]);

  // Fetch services (optional, to fill price/image if not passed via state)
  useEffect(() => {
    (async () => {
      try {
        if (!applicationId) {
          setFetchedServices([]);
          return;
        }
        const res = await fetch(
          `http://localhost:3000/api/services/by-application/${applicationId}`
        );
        const rows = (await res.json()) || [];
        const mapped = rows.map((s) => ({
          name: s.name,
          price: Number(s.price ?? 0),
          img: normalizeImg(s.image_url),
        }));
        setFetchedServices(mapped);
      } catch {
        setFetchedServices([]);
      }
    })();
  }, [applicationId]);

  // Resolve selected service (name from state; price/img from state or fetched list)
  const selectedService = useMemo(() => {
    const fromApi = fetchedServices.find((s) => s.name === selectedServiceName);
    return {
      name: selectedServiceName,
      price:
        Number.isFinite(Number(statePrice)) && statePrice !== null
          ? Number(statePrice)
          : Number(fromApi?.price ?? 0),
      img: stateImg ? normalizeImg(stateImg) : fromApi?.img || placeholderImg,
    };
  }, [selectedServiceName, statePrice, stateImg, fetchedServices]);

  // Price with vehicle surcharge (₱200 if Car)
  const finalPrice = useMemo(() => {
    const base = Number(selectedService.price ?? 0);
    return base + (vehicleType === "Car" ? 200 : 0);
  }, [selectedService.price, vehicleType]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = user.id || user.user_id || "";

    const service_name = selectedService.name;
    const basePrice = Number(selectedService.price ?? 0);
    const price = basePrice + (vehicleType === "Car" ? 200 : 0);
    const schedule_date = form.date;
    const address = form.address;
    const message = form.message;
    const schedule_time = form.time;

    if (!user_id || !applicationId || !service_name || !schedule_date || !address || !vehicleType || !form.vehicleModel) {
      toast.error("Missing required fields.");
      setSubmitting(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id,
          applicationId,
          service_name,
          schedule_date,
          address,
          message,
          personnelId: selectedPersonnelId,
          price, // includes vehicle surcharge if Car
          schedule_time,
          vehicle_type: vehicleType,
          vehicle_model: form.vehicleModel,   // NEW
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit booking.");
      navigate("/booking-status", { state: { appointment_id: data.appointment_id } });
    } catch (error) {
      toast.error(error?.message || "Failed to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  // Optional: support refresh scenario where appointment_id could be passed
  const appointment_id = location.state?.appointment_id;
  useEffect(() => {
    if (!appointment_id) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user.user_id || "";
      if (userId) {
        fetch(`http://localhost:3000/api/bookings/customers/${userId}`).then((r) => r.json());
      }
    }
  }, [appointment_id]);

  // Check if the booking is completed and paid (after booking is made)
  useEffect(() => {
    if (!appointment_id) return;
    setBookingStatus({ completed: false, paid: false });

    fetch(`http://localhost:3000/api/bookings/with-personnel/${appointment_id}`)
      .then(res => res.ok ? res.json() : null)
      .then(bookingData => {
        if (bookingData) {
          const completed = bookingData.status === "Completed";
          const paid = Array.isArray(bookingData.payments) && bookingData.payments.some(p => p.payment_status === "Paid");
          setBookingStatus({ completed, paid });
        }
      })
      .catch(() => {
        setBookingStatus({ completed: false, paid: false });
      });
  }, [appointment_id]);

  // Fetch unavailable personnel for selected date/time (strict 60-minute gap)
  useEffect(() => {
    async function fetchUnavailablePersonnel() {
      if (!form.date || !form.time || !applicationId) {
        setUnavailablePersonnelIds([]);
        return;
      }
      try {
        const params = new URLSearchParams({
          applicationId: String(applicationId),
          date: form.date,
        });
        const res = await fetch(
          `http://localhost:3000/api/bookings/by-date-time?${params.toString()}`
        );
        if (!res.ok) throw new Error('Failed to load existing bookings');
        const rows = (await res.json()) || [];

        const inactive = ['cancel', 'refunded', 'declined', 'done', 'completed'];
        const isInactive = (row) => {
          const s = String(
            row?.status ?? row?.booking_status ?? row?.payment_status ?? ''
          ).toLowerCase();
          return inactive.some((k) => s.includes(k));
        };

        const toMinutes = (t) => {
          if (!t) return NaN;
          const m = String(t).match(/^(\d{1,2}):(\d{2})/);
          if (!m) return NaN;
          return Number(m[1]) * 60 + Number(m[2]);
        };

        const selectedMin = toMinutes(form.time);

        // Block any personnel with a booking within 60 minutes of selected time
        const conflicting = rows.filter((row) => {
          if (isInactive(row)) return false;
          const rowTime = toMinutes(row?.schedule_time);
          if (Number.isNaN(selectedMin) || Number.isNaN(rowTime)) return false;
          const diff = Math.abs(rowTime - selectedMin);
          return diff < 60; // strict 60-minute gap
        });

        const ids = conflicting
          .map((row) => {
            const id =
              row?.personnelId ??
              row?.personnel_id ??
              row?.personnelID ??
              row?.personnelid;
            return id != null ? String(id) : null;
          })
          .filter(Boolean);

        setUnavailablePersonnelIds(ids);
      } catch {
        setUnavailablePersonnelIds([]);
      }
    }
    fetchUnavailablePersonnel();
  }, [applicationId, form.date, form.time]);

  const selectedPersonnel = personnelList.find(
    (p) => String(p.personnelId) === String(selectedPersonnelId)
  );

  function parseTime(str) {
    // Converts "8:00 AM" to "08:00", "3:00 PM" to "15:00"
    if (!str) return "";
    let [time, period] = str.split(" ");
    let [hour, minute] = time.split(":");
    hour = Number(hour);
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  }

  let personnelMinTime = "";
  let personnelMaxTime = "";
  if (selectedPersonnel?.time_available) {
    // Example: "8:00 AM - 3:00 PM"
    const [start, end] = selectedPersonnel.time_available.split(" - ");
    personnelMinTime = parseTime(start);
    personnelMaxTime = parseTime(end);
  }

  function getDayOfWeek(dateStr) {
    // Returns "Mon", "Tue", etc. for a yyyy-mm-dd string
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date(dateStr);
    return days[d.getDay()];
  }

  const availableDays = selectedPersonnel?.day_available?.split(",").map(d => d.trim()); // ["Mon", "Wed", "Fri"]

  return (
    <div
      className="min-h-screen flex bg-[#c8f1ff] relative"
      style={{
        backgroundImage:
          "url('https://media1.giphy.com/media/v1.Y2lkPTZjMDliOTUyaWE2Zzlla3FhdWRvN2RwbTVrNDV3NzhlMnNmdm8yOGswNTZxM2FzMiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/dkNo3GLO22E5xORKL4/source.gif')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Toaster position="top-center" />
      <div className="w-72" />
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="bg-white bg-opacity-95 rounded-2xl shadow p-10 max-w-2xl w-full mx-auto mt-10 mb-10 border border-gray-200 relative">
          <button
            className="absolute left-6 top-6 text-black hover:bg-gray-100 rounded-full p-1"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <h1 className="text-3xl font-semibold mb-2 mt-2 text-center w-full">
            You have booked <span className="text-blue-600">{selectedService.name}</span> in{" "}
            <span className="text-cyan-600">{carwashName}</span>
          </h1>
          <p className="mb-6 text-gray-700 text-center w-full">
            Please review your selected service and fill out the booking form below.
          </p>

          {/* Service summary */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-4 border rounded-lg p-3 bg-white">
              <img
                src={selectedService.img}
                alt={selectedService.name}
                className="w-20 h-20 rounded object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = placeholderImg;
                }}
              />
              <div>
                <div className="font-semibold">{selectedService.name}</div>
                <div className="text-gray-700">
                  Price: ₱{finalPrice}
                </div>
                {vehicleType === "Car" && (
                  <div className="text-xs text-gray-500">
                    Includes ₱200 car service fee
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    className="pl-9 pr-3 py-2 rounded border border-gray-300 w-full focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    className="pl-9 pr-3 py-2 rounded border border-gray-300 w-full focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Johndoe123@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    className="pl-9 pr-3 py-2 rounded border border-gray-300 w-full focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Type + Model */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Vehicle type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Car">Car</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Vehicle model</label>
                <input
                  type="text"
                  name="vehicleModel"
                  placeholder="e.g., Toyota Vios 2018"
                  value={form.vehicleModel}
                  onChange={handleChange}
                  className="px-3 py-2 rounded border border-gray-300 w-full focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Pilipog Cordova Cebu"
                    value={form.address}
                    onChange={handleChange}
                    className="pl-9 pr-3 py-2 rounded border border-gray-300 w-full focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-gray-700">Schedule date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className="pl-9 pr-3 py-2 rounded border border-gray-300 w-full focus:outline-none"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    disabled={!availableDays?.length}
                    onInput={e => {
                      const chosenDay = getDayOfWeek(e.target.value);
                      if (availableDays && !availableDays.includes(chosenDay)) {
                        e.target.setCustomValidity(`Please select an available day: ${availableDays.join(", ")}`);
                      } else {
                        e.target.setCustomValidity("");
                      }
                    }}
                  />
                  {!availableDays?.length && (
                    <div className="text-xs text-red-500 mt-1">
                      Please select a carwash boy to see available days.
                    </div>
                  )}
                  {selectedPersonnel && selectedPersonnel.day_available && (
                    <div className="mt-2 text-sm text-blue-700">
                      <strong>Available Day:</strong> {selectedPersonnel.day_available}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <label className="block mb-1 text-gray-700">Select Carwash Boy</label>
              <select
                name="personnelId"
                value={selectedPersonnelId}
                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select...</option>
                {personnelList.map((p) => (
                  <option
                    key={p.personnelId}
                    value={p.personnelId}
                    disabled={unavailablePersonnelIds.includes(String(p.personnelId))}
                    style={
                      unavailablePersonnelIds.includes(String(p.personnelId))
                        ? { backgroundColor: "#f3f3f3", color: "#bbb" }
                        : {}
                    }
                  >
                    {p.first_name} {p.last_name}
                    {unavailablePersonnelIds.includes(String(p.personnelId)) ? " (Unavailable)" : ""}
                  </option>
                ))}
              </select>
              {selectedPersonnel && selectedPersonnel.time_available && (
                <div className="mb-2 text-sm text-blue-700">
                  <strong>Available Time:</strong> {selectedPersonnel.time_available}
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="block mb-1 text-gray-700">Select Time</label>
              <input
                type="time"
                name="time"
                value={form.time || ""}
                onChange={handleChange}
                className="pl-9 pr-3 py-2 rounded border border-gray-300 w-full focus:outline-none"
                required
                min={personnelMinTime}
                max={personnelMaxTime}
                disabled={!personnelMinTime || !personnelMaxTime}
                onInput={e => {
                  const val = e.target.value;
                  if (personnelMinTime && personnelMaxTime && (val < personnelMinTime || val > personnelMaxTime)) {
                    e.target.setCustomValidity(`Please select a time between ${personnelMinTime} and ${personnelMaxTime}.`);
                  } else {
                    e.target.setCustomValidity("");
                  }
                }}
              />
              {(!personnelMinTime || !personnelMaxTime) && (
                <div className="text-xs text-red-500 mt-1">
                  Please select a carwash boy with available time.
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1 text-gray-700">Additional message</label>
              <textarea
                name="message"
                placeholder="Type any additional request or message here."
                value={form.message}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded p-3 min-h-[80px] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-[#b3e0ff] hover:bg-[#90c8e8] text-black text-2xl font-medium py-2 rounded border border-gray-300 transition"
              disabled={
                submitting ||
                (selectedPersonnelId && unavailablePersonnelIds.includes(String(selectedPersonnelId)))
              }
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            {selectedPersonnelId && unavailablePersonnelIds.includes(String(selectedPersonnelId)) && (
              <div className="text-red-500 text-sm mt-2">
                This carwash boy is unavailable within 1 hour of your selected time. Please choose another time or personnel.
              </div>
            )}
          </form>

          {/* Example usage: show a message if booking is completed and paid */}
          {bookingStatus.completed && bookingStatus.paid && (
            <div className="bg-green-100 text-green-700 rounded p-4 mb-4 text-center">
              Your booking is <b>Completed</b> and <b>Paid</b>. Thank you!
            </div>
          )}
        </div>
      </div>

      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-[#c8f1ff] opacity-60 pointer-events-none z-0" />
    </div>
  );
}

export default BookForm;