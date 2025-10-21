import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, User, Phone, CheckCircle } from "lucide-react";
import { FaEnvelope, FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt, FaUndo } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const appointment_id = location.state?.appointment_id;

  const [booking, setBooking] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state for Request Refund
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);

  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // NEW: owner phone for "Need our help?"
  const [ownerPhone, setOwnerPhone] = useState("");

  // Use booking.appointment_id if available, else the one from location
  const apiAppointmentId = booking?.appointment_id || appointment_id;

  // Normalize and compare statuses (handles case and spaces)
  const normalizeStatus = (s) => String(s || "").toLowerCase().replace(/\s+/g, "");
  const statusIs = (s, t) => normalizeStatus(s) === normalizeStatus(t);
  const isActiveStatus = (s) =>
    ["Confirmed", "On Going", "Halfway", "Completed"].some((t) => statusIs(s, t));

  // Helper to resolve carwash logo URL
  const placeholderLogo = "/default-logo.png";
  const normalizeLogo = (raw) => {
    if (!raw) return placeholderLogo;
    const s = String(raw);
    if (s.startsWith("http")) return s;
    if (!s.startsWith("/")) return `http://localhost:3000/uploads/logos/${s}`;
    return `http://localhost:3000${s}`;
  };

  // Fetch booking details
  useEffect(() => {
    if (appointment_id) {
      fetch(`http://localhost:3000/api/bookings/with-personnel/${appointment_id}`)
        .then((res) => res.json())
        .then((data) => {
          setBooking(data);
        })
        .catch(() => {
          setBooking(null);
        });
    } else {
      setBooking(null);
    }
  }, [appointment_id]);

  // NEW: Resolve owner phone using owner_id or applicationId
  useEffect(() => {
    let ignore = false;
    async function loadOwnerPhone() {
      try {
        const ownerId = booking?.owner_id ?? booking?.ownerId;
        // 1) Try via owner_id
        if (ownerId) {
          const r1 = await fetch(`http://localhost:3000/api/owners/${ownerId}/phone`);
          if (r1.ok) {
            const d1 = await r1.json();
            if (!ignore) setOwnerPhone(d1?.owner_phone || "");
            if (d1?.owner_phone) return;
          }
        }
        // 2) Fallback via applicationId
        if (booking?.applicationId) {
          const r2 = await fetch(`http://localhost:3000/api/applications/${booking.applicationId}/owner-phone`);
          if (r2.ok) {
            const d2 = await r2.json();
            if (!ignore) setOwnerPhone(d2?.owner_phone || "");
            return;
          }
        }
        if (!ignore) setOwnerPhone("");
      } catch {
        if (!ignore) setOwnerPhone("");
      }
    }
    if (booking) loadOwnerPhone();
    return () => { ignore = true; };
  }, [booking, booking?.owner_id, booking?.ownerId, booking?.applicationId]);

  // Fetch personnel if not already set
  useEffect(() => {
    let ignore = false;
    const ownerId = booking ? booking.owner_id : undefined;
    if (ownerId && !booking.personnelId) {
      fetch(`http://localhost:3000/api/personnel/by-owner/${ownerId}`)
        .then((res) => res.json())
        .then((personnelList) => {
          if (!ignore && personnelList && personnelList.length > 0) {
            const carwashBoy = personnelList[0];
            setBooking((prev) => ({
              ...prev,
              personnelId: carwashBoy?.personnelId,
              personnel_first_name: carwashBoy?.first_name,
              personnel_last_name: carwashBoy?.last_name,
              personnel_address: carwashBoy?.address,
              personnel_email: carwashBoy?.email,
              personnel_avatar: carwashBoy?.avatar,
            }));
          }
        });
    }
    return () => { ignore = true; };
  }, [booking, booking?.owner_id]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id || user.user_id;
    if (userId) {
      fetch(`http://localhost:3000/api/bookings/customers/${userId}`)
        .then(res => res.json())
        .then(bookings => {
          const latest = bookings.find(
            b => b.status !== "Declined" && b.status !== "Done" && b.status !== "Cancelled"
          );
          setActiveBooking(latest || null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-open feedback modal once booking is completed (only once per appointment)
  useEffect(() => {
    if (!apiAppointmentId) return;
    const already = localStorage.getItem(`feedback:${apiAppointmentId}`);
    if (booking?.status === "Completed" && !already) {
      setShowFeedbackModal(true);
    }
  }, [booking?.status, apiAppointmentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
        <div className="text-gray-500 text-xl">Loading...</div>
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2 text-black">No Appointments Booked</h2>
          <p className="mb-6 text-gray-700 text-center">
            You currently have no active appointments. Book a service to get started!
          </p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold"
            onClick={() => navigate("/popular-carwash")}
          >
            Book Now
          </button>
        </div>
      </div>
    );
  }

  if (  
    !booking ||
    !isActiveStatus(booking.status)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff]">
        <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-2 text-black">Booking Not Active</h2>
          <p className="mb-6 text-gray-700 text-center">
            Your booking is not active. Please wait for confirmation or check your booking status.
          </p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 font-semibold"
            onClick={() => navigate("/popular-carwash")}
          >
            Back to Carwash Shops
          </button>
        </div>
      </div>
    );
  }

  // Coerce mixed inputs to number
  const toNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const cleaned = typeof v === "string" ? v.replace(/[, ]/g, "") : v;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const servicePrice = toNumber(booking?.price);

  const paidAmount =
    location.state?.paid_amount !== undefined
      ? toNumber(location.state.paid_amount)
      : Array.isArray(booking?.payments)
        ? booking.payments.reduce((sum, p) => sum + toNumber(p.amount), 0)
        : toNumber(booking?.paid_amount);

  const remainingBalance = servicePrice - paidAmount;

  const handleCancelBooking = async () => {
    if (!appointment_id) return;
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCanceling(true);
    try {
      const res = await fetch(`http://localhost:3000/api/bookings/cancel/${appointment_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to cancel booking.");
      setCancelSuccess(true);
      setBooking((prev) => ({ ...prev, status: "Cancelled" }));
    } catch {
      alert("Failed to cancel booking.");
    }
    setCanceling(false);
  };

  // Handle refund request
  const handleRequestRefund = async () => {
    setRefundLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const customer = `${user.first_name || ""} ${user.last_name || ""}`.trim();

      // Refund amount logic: use paidAmount (partial or full)
      const amount = paidAmount;
      const bookingId = appointment_id;
      const ownerId = booking?.applicationId;

      if (!customer || !amount || !refundReason || !bookingId || !ownerId) {
        alert("Please fill all refund details.");
        setRefundLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:3000/api/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          amount,
          reason: refundReason,
          bookingId,
          ownerId
        }),
      });
      if (res.ok) {
        setRefundSuccess(true);
        setRefundReason("");
      } else {
        setRefundSuccess(false);
        alert("Failed to request refund.");
      }
    } catch {
      setRefundSuccess(false);
      alert("Failed to request refund.");
    }
    setRefundLoading(false);
  };

  // Helper to get latest payment status
  const getLatestPaymentStatus = () => {
    if (Array.isArray(booking?.payments) && booking.payments.length > 0) {
      // Sort payments by created_at descending and get the latest
      const sorted = [...booking.payments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return sorted[0].payment_status || "Unpaid";
    }
    return booking?.payment_status || "Unpaid";
  };

  const latestPaymentStatus = getLatestPaymentStatus();

  // Helper to check if booking is paid or partial
  const isPaid =
    ["Paid", "Partial"].includes(latestPaymentStatus) ||
    (Array.isArray(booking?.payments) &&
      booking.payments.some((p) => ["Paid", "Partial"].includes(p.payment_status)));

  // NEW: fully paid flag (locks Pay Now)
  const isFullyPaid = latestPaymentStatus === "Paid" || remainingBalance <= 0;

  const handleSubmitFeedback = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = user.user_id || user.id;

    if (!user_id || !apiAppointmentId) {
      toast.error("Missing data to submit feedback.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/feedback/${apiAppointmentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id, rating, comment }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        // Feedback already submitted for this booking
        localStorage.setItem(`feedback:${apiAppointmentId}`, "1");
        setShowFeedbackModal(false);
        toast.error(data.error || "Feedback already submitted for this booking.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      localStorage.setItem(`feedback:${apiAppointmentId}`, "1");
      setShowFeedbackModal(false);
      setComment("");
      toast.success("Thank you for your feedback!");
    } catch (e) {
      toast.error(e.message || "Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#c8f1ff]">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col min-h-screen">
        <div className="flex items-center px-8 py-8 border-b border-gray-100">
          <span className="text-3xl" style={{ fontFamily: "Brush Script MT, cursive" }}>
            <span className="text-cyan-500">Wash</span>{" "}
            <span className="text-red-500">Connect</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Inbox removed */}
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => navigate('/user-dashboard')}
          >
            <FaUser className="mr-3 w-5 h-5" />
            Account
          </div>
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => navigate('/popular-carwash')}
          >
            <FaStar className="mr-3 w-5 h-5" />
            Carwash Shops
          </div>
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => navigate('/book')}
          >
            <FaHeart className="mr-3 w-5 h-5" />
            Services
          </div>
          {/* Track Status tab above Appointment, NOT bold or highlighted */}
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-cyan-100 text-cyan-700 cursor-pointer"
            onClick={() => navigate("/track-status")}
          >
            <span className="text-xl">🔎</span>
            <span className="text-gray-700 ml-2">Track Status</span>
          </div>
          {/* Appointment tab highlighted and bold */}
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold cursor-pointer"
            onClick={() => navigate("/booking-confirmation", { state: { appointment_id } })}
          >
            <FaCalendarAlt className="mr-3 w-5 h-5" />
            Appointment
          </div>
          <div className="mt-auto px-4 pt-8">
            <div
              className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
              }}
            >
              <FaSignOutAlt className="mr-3 w-5 h-5" />
              LogOut
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center py-8 px-4">
        <div className="flex items-center w-full max-w-5xl mb-6">
          <button
            className="mr-4 text-black hover:bg-gray-100 rounded-full p-2"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft size={32} />
          </button>
          <h1 className="text-3xl font-semibold text-gray-700">Appointment</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
          {/* Left: Booking Info */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <span className="bg-green-100 rounded-full p-2 mr-3">
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="12" fill="#22c55e" />
                    <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <div className="text-lg font-semibold text-green-700">Appointment Booked!</div>
                  <div className="text-gray-600 text-sm">You'll receive a confirmation mail shortly!</div>
                </div>
                <span className={`ml-auto px-4 py-1 rounded-full font-semibold text-sm flex items-center ${
                  statusIs(booking.status, "Completed")
                    ? "bg-green-100 text-green-700"
                    : statusIs(booking.status, "Halfway")   // covers "halfway" and "half way"
                    ? "bg-yellow-100 text-yellow-700"
                    : statusIs(booking.status, "On Going")
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  ● {booking.status}
                </span>
              </div>
              {/* Carwash Logo */}
              <div className="rounded-lg overflow-hidden mb-3 h-52 bg-white flex items-center justify-center relative border border-gray-200">
                <img
                  src={normalizeLogo(booking?.logo)}
                  alt={(booking?.carwashName || "Carwash") + " logo"}
                  className="w-full h-full object-contain p-3"
                  draggable="false"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + placeholderLogo) {
                      e.currentTarget.src = placeholderLogo;
                    }
                  }}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center mb-1 text-gray-700">
                    <Phone className="w-4 h-4 mr-2" />
                    {booking.customer_phone}
                  </div>
                  <div className="flex items-center mb-1 text-gray-700">
                    <Mail className="w-4 h-4 mr-2" />
                    {booking.customer_email}
                  </div>
                  <div className="flex items-center mb-1 text-gray-700">
                    <User className="w-4 h-4 mr-2" />
                    {booking.customer_first_name} {booking.customer_last_name}
                  </div>
                  {/* Display time booked and date */}
                  <div className="flex items-center mb-1 text-gray-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      <b>Schedule Date:</b>{" "}
                      {booking.schedule_date
                        ? booking.schedule_date.split("T")[0]
                        : ""}
                      &nbsp; <b>Time Booked:</b> {booking.schedule_time}
                    </span>
                  </div>
                  {/* REMOVED: View Location button */}
                  {/* <button className="mt-2 px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-sm">
                    View Location
                  </button> */}
                </div>
              </div>
              <div className="border-t pt-2 mt-2 text-xs text-gray-500">
                <div className="font-semibold mb-1">Assigned Carwash Boy</div>
                {booking.personnelId ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        booking.personnel_avatar
                          ? booking.personnel_avatar.startsWith("/uploads")
                            ? `http://localhost:3000${booking.personnel_avatar}`
                            : booking.personnel_avatar
                          : "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(
                              `${booking.personnel_first_name || ""} ${booking.personnel_last_name || ""}`.trim()
                            )
                      }
                      alt="Carwash Boy"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div>
                        <span className="font-semibold">Carwash boy:</span>{" "}
                        {booking.personnel_first_name} {booking.personnel_last_name}
                      </div>
                      <div>
                        <span className="font-semibold">Address:</span> {booking.personnel_address}
                      </div>
                      <div>
                        <span className="font-semibold">Email:</span> {booking.personnel_email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">No personnel assigned yet.</div>
                )}
                <div className="mt-2 text-gray-600">
                  Carwashboy will arrive in <b>10 - 30 minutes</b>
                </div>
                <div className="flex gap-2 mt-3">
                  {/** Define personnel_id from booking.personnelId */}
                  {(() => {
                    return (
                      <>
                        <button
                          className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded font-semibold hover:bg-blue-200 text-sm"
                          onClick={() => navigate("/reschedule", { state: { appointment_id, personnel_id: booking.personnelId } })}
                        >
                          Reschedule
                        </button>
                        <button
                          className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded font-semibold hover:bg-red-200 text-sm"
                          onClick={handleCancelBooking}
                          disabled={canceling || booking.status === "Declined"}
                        >
                          {canceling ? "Cancelling..." : booking.status === "Declined" ? "Booking Cancelled" : "Cancel Booking"}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            {/* Service Checklist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
              <div className="px-5 py-3 border-b">
                <div className="font-semibold">Service Checklist</div>
              </div>

              <ul className="p-5 space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Confirm your schedule date and time.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Keep your phone reachable for updates from the carwash boy.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Prepare vehicle and access if service is at your location.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  Settle any remaining balance after the service.
                </li>
              </ul>

              <div className="px-5 pb-5">
                <div className="text-xs text-gray-500 mb-2">Need our help?</div>
                {ownerPhone ? (
                  <a
                    href={`tel:${ownerPhone}`}
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-gray-100 hover:bg-gray-200 text-sm"
                  >
                    <Phone className="w-4 h-4" /> {ownerPhone}
                  </a>
                ) : (
                  <div className="text-gray-500 text-sm">Phone not available</div>
                )}
              </div>
            </div>
          </div>
          {/* Right: Payment Summary */}
          <div className="w-full md:w-80">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200 mb-4">
              <div className="font-semibold text-lg mb-2">Payment Summary</div>
              {/* Show latest payment status */}
              <div className="mb-2">
                <span className="font-semibold">Payment Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                  latestPaymentStatus === "Paid"
                    ? "bg-green-100 text-green-700"
                    : latestPaymentStatus === "Partial"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {latestPaymentStatus}
                </span>
              </div>
              <div className="bg-white border rounded p-4 mb-3">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>PHP {servicePrice}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Paid Amount</span>
                  <span>PHP {paidAmount}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Remaining Balance</span>
                  <span>PHP {remainingBalance > 0 ? remainingBalance : 0}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Partial payment</span>
                  <span>PHP {servicePrice / 2}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Discount</span>
                  <span>PHP 00.00</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>PHP {remainingBalance > 0 ? remainingBalance : 0}</span>
                </div>
              </div>
              <button
                className={`w-full py-2 rounded font-semibold mb-2 ${
                  isFullyPaid
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
                onClick={() => {
                  if (isFullyPaid) return;
                  navigate("/payment", {
                    state: {
                      appointment_id,
                      previousPayments: paidAmount,
                      subtotal: servicePrice
                    }
                  });
                }}
                disabled={isFullyPaid}
                title={isFullyPaid ? "Already paid" : "Proceed to payment"}
              >
                {isFullyPaid ? "Paid" : "Pay Now"}
              </button>
              <button
                className="w-full bg-gray-200 text-gray-700 py-2 rounded font-semibold hover:bg-gray-300"
                onClick={handleCancelBooking}
                disabled={canceling || booking.status === "Declined"}
              >
                {canceling ? "Cancelling..." : booking.status === "Declined" ? "Booking Cancelled" : "Request Cancellation"}
              </button>
              {/* Request Refund Button */}
              {isPaid && (
                <button
                  className="w-full bg-red-500 text-white py-2 rounded font-semibold mt-2 hover:bg-red-600 flex items-center justify-center gap-2"
                  onClick={() => setShowRefundModal(true)}
                >
                  <FaUndo /> Request a Refund
                </button>
              )}
              {cancelSuccess && (
                <div className="text-red-600 mt-2 font-semibold">
                  Booking has been cancelled.
                </div>
              )}
            </div>
          </div>
        </div>
        {booking.status === "Completed" && isPaid && (
          <button
            className="w-full bg-green-600 text-white py-2 rounded font-semibold mt-4 hover:bg-green-700"
            onClick={() => {
              setActiveBooking(null);
              setBooking(null);
              navigate("/book");
            }}
          >
            Booking Complete! Book Again
          </button>
        )}
      </div>
      {/* Request Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaUndo className="text-lg" /> Request a Refund
            </h2>
            <div className="mb-2 font-medium">
              Refund Amount: <span className="font-bold">PHP {paidAmount}</span>
            </div>
            <label className="block mb-2 font-medium">Reason for refund:</label>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={3}
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund..."
            />
            <div className="flex gap-3">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                onClick={handleRequestRefund}
                disabled={refundLoading || !refundReason}
              >
                {refundLoading ? "Requesting..." : "Submit Request"}
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-300"
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason("");
                  setRefundSuccess(false);
                }}
                disabled={refundLoading}
              >
                Cancel
              </button>
            </div>
            {refundSuccess && (
              <div className="text-green-600 mt-4 font-semibold">
                Refund request submitted!
              </div>
            )}
          </div>
        </div>
      )}
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">
              Rate {booking?.carwashName || "Carwash"}
            </h3>
            <div className="text-sm text-gray-600 mb-4">
              {booking?.service_name || booking?.service || "Service"}
            </div>

            {/* Stars */}
            <div className="flex items-center gap-2 mb-4">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="text-2xl"
                  title={`${n} star${n>1 ? "s" : ""}`}
                >
                  <span className={n <= rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-700">{rating}/5</span>
            </div>

            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={3}
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => {
                  localStorage.setItem(`feedback:${appointment_id}`, "1");
                  setShowFeedbackModal(false);
                }}
                disabled={submittingFeedback}
              >
                Skip
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingConfirmation;