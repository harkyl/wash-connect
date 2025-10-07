import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, User, MapPin, Phone } from "lucide-react";
import { FaEnvelope, FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt, FaUndo } from "react-icons/fa";
import CarwashMapImg from "../assets/carwash-location.png"; // <-- add this

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
    !["Confirmed", "On Going", "halfway", "Completed"].includes(booking.status)
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

  return (
    <div className="min-h-screen flex bg-[#c8f1ff]">
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
            Bookings
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
                  booking.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : booking.status === "halfway"
                    ? "bg-yellow-100 text-yellow-700"
                    : booking.status === "On Going"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  ● {booking.status}
                </span>
              </div>
              {/* Interactive Map */}
              <div className="rounded-lg overflow-hidden mb-3 h-52 bg-gray-100 flex items-center justify-center relative">
                <img
                  src={CarwashMapImg}
                  alt="Carwash shop location"
                  className="w-full h-full object-cover"
                  draggable="false"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs p-2 flex items-start gap-2">
                  <span className="font-semibold">Address:</span>
                  <span className="truncate">
                    {booking.address || "No address available"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center mb-1 text-gray-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    {booking.address}
                  </div>
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
                  <button className="mt-2 px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200 text-sm">
                    View Location
                  </button>
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
            <div className="bg-white rounded-xl shadow p-4 mb-4 border border-gray-200">
              <div className="font-semibold mb-2">Service Checklist</div>
              <div className="text-gray-700 text-sm">
                See what all you should know or do while the carwashboy serve you.
              </div>
            </div>
            {/* Need help */}
            <div className="bg-white rounded-xl shadow p-4 mb-4 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-semibold mb-1">Need our help?</div>
                <div className="text-gray-700 text-sm">
                  Call us in case you face any issue in our service
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border rounded bg-gray-100 hover:bg-gray-200 text-sm">
                <Phone className="w-4 h-4" /> 09949066002
              </button>
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
              <button className="w-full bg-green-500 text-white py-2 rounded font-semibold mb-2 hover:bg-green-600"
                onClick={() =>
                  navigate("/payment", {
                    state: {
                      appointment_id,
                      previousPayments: paidAmount,
                      subtotal: servicePrice
                    }
                  })
                }
              >
                Pay Now
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
    </div>
  );
}

export default BookingConfirmation;