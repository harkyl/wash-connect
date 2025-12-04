import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, User, Phone, CheckCircle, Menu, X, MoreVertical } from "lucide-react";
import { FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt, FaUndo } from "react-icons/fa";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Get user info
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

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

  const closeSidebar = () => setSidebarOpen(false);

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
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff] px-4">
        <div className="bg-white rounded-xl shadow p-6 sm:p-8 flex flex-col items-center max-w-md w-full">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-black text-center">No Appointments Booked</h2>
          <p className="mb-6 text-gray-700 text-center text-sm sm:text-base">
            You currently have no active appointments. Book a service to get started!
          </p>
          <button
            className="bg-blue-500 text-white px-6 py-2.5 rounded hover:bg-blue-600 font-semibold w-full sm:w-auto"
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
      <div className="min-h-screen flex items-center justify-center bg-[#c8f1ff] px-4">
        <div className="bg-white rounded-xl shadow p-6 sm:p-8 flex flex-col items-center max-w-md w-full">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-black text-center">Booking Not Active</h2>
          <p className="mb-6 text-gray-700 text-center text-sm sm:text-base">
            Your booking is not active. Please wait for confirmation or check your booking status.
          </p>
          <button
            className="bg-blue-500 text-white px-6 py-2.5 rounded hover:bg-blue-600 font-semibold w-full sm:w-auto"
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
      
      // NEW: If payment was made (Paid or Partial), automatically create refund request
      if (isPaid && paidAmount > 0) {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const customer = `${user.first_name || ""} ${user.last_name || ""}`.trim();
          const ownerId = booking?.applicationId;

          await fetch(`http://localhost:3000/api/refunds`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer,
              amount: paidAmount,
              reason: "Booking cancelled by customer - automatic refund request",
              bookingId: appointment_id,
              ownerId
            }),
          });
          
          toast.success("Booking cancelled. Refund request has been automatically submitted for PHP " + paidAmount);
        } catch (refundErr) {
          console.error("Failed to create automatic refund:", refundErr);
          toast.error("Booking cancelled, but failed to create refund request. Please request refund manually.");
        }
      } else {
        toast.success("Booking has been cancelled successfully.");
      }
      
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white/95 backdrop-blur border-r border-gray-200 flex flex-col min-h-screen shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Close Button */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
          <span className="text-2xl sm:text-3xl" style={{ fontFamily: "Brush Script MT, cursive" }}>
            <span className="text-cyan-500">Wash</span>{" "}
            <span className="text-red-500">Connect</span>
          </span>
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={closeSidebar}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            onClick={() => { closeSidebar(); navigate("/user-dashboard"); }}
          >
            <FaUser className="mr-3 w-5 h-5" />
            Account
          </div>
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            onClick={() => { closeSidebar(); navigate("/popular-carwash"); }}
          >
            <FaStar className="mr-3 w-5 h-5" />
            Carwash Shops
          </div>
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            onClick={() => { closeSidebar(); navigate("/book"); }}
          >
            <FaHeart className="mr-3 w-5 h-5" />
            Services
          </div>
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            onClick={() => { closeSidebar(); navigate("/track-status"); }}
          >
            <span className="mr-3 text-lg">🔎</span>
            Track Status
          </div>
          <div className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold cursor-pointer">
            <FaCalendarAlt className="mr-3 w-5 h-5" />
            Appointment
          </div>
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 cursor-pointer transition-colors"
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#7cc3e2] to-[#a8d6ea] border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <button
              className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-white">Appointment</h1>
          </div
          >
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Profile - Hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-cyan-200">
              <FaUser className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                {userName || "User"}
              </span>
            </div>
            
            {/* Three dots menu */}
            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Open menu"
              >
                <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              {menuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-cyan-50 text-cyan-700 font-medium text-sm transition-colors"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/feedback");
                      }}
                    >
                      Send Feedback
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              {/* Left: Booking Info */}
              <div className="flex-1">
                <div className="bg-white rounded-xl shadow p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
                  {/* Status Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center">
                      <span className="bg-green-100 rounded-full p-2 mr-3 flex-shrink-0">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="12" fill="#22c55e" />
                          <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div>
                        <div className="text-base sm:text-lg font-semibold text-green-700">Appointment Booked!</div>
                        <div className="text-gray-600 text-xs sm:text-sm">You'll receive a confirmation mail shortly!</div>
                      </div>
                    </div>
                    <span className={`self-start sm:self-auto sm:ml-auto px-3 py-1 rounded-full font-semibold text-xs sm:text-sm flex items-center ${
                      statusIs(booking.status, "Completed")
                        ? "bg-green-100 text-green-700"
                        : statusIs(booking.status, "Halfway")
                        ? "bg-yellow-100 text-yellow-700"
                        : statusIs(booking.status, "On Going")
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      ● {booking.status}
                    </span>
                  </div>

                  {/* Carwash Logo */}
                  <div className="rounded-lg overflow-hidden mb-3 h-36 sm:h-44 lg:h-52 bg-white flex items-center justify-center relative border border-gray-200">
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

                  {/* Customer Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-700 text-sm">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{booking.customer_phone}</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-sm">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{booking.customer_email}</span>
                    </div>
                    <div className="flex items-center text-gray-700 text-sm">
                      <User className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{booking.customer_first_name} {booking.customer_last_name}</span>
                    </div>
                    <div className="flex items-start text-gray-700 text-sm">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        <b>Date:</b>{" "}
                        {booking.schedule_date
                          ? booking.schedule_date.split("T")[0]
                          : ""}
                        <span className="mx-1">•</span>
                        <b>Time:</b> {booking.schedule_time}
                      </span>
                    </div>
                  </div>

                  {/* Personnel Section */}
                  <div className="border-t pt-4 mt-4">
                    <div className="font-semibold text-sm mb-2">Assigned Carwash Boy</div>
                    {booking.personnelId ? (
                      <div className="flex items-start gap-3">
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
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="text-xs sm:text-sm text-gray-600 min-w-0">
                          <div className="truncate">
                            <span className="font-semibold">Name:</span>{" "}
                            {booking.personnel_first_name} {booking.personnel_last_name}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold">Address:</span> {booking.personnel_address}
                          </div>
                          <div className="truncate">
                            <span className="font-semibold">Email:</span> {booking.personnel_email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">No personnel assigned yet.</div>
                    )}
                    <div className="mt-2 text-gray-600 text-xs sm:text-sm">
                      Carwashboy will arrive in <b>10 - 30 minutes</b>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                      {(() => {
                        const isActionDisabled = 
                          statusIs(booking.status, "Halfway") || 
                          statusIs(booking.status, "On Going") || 
                          statusIs(booking.status, "Completed");
                        
                        return (
                          <>
                            <button
                              className={`flex-1 px-3 py-2.5 rounded font-semibold text-sm transition-colors ${
                                isActionDisabled
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-[0.98]"
                              }`}
                              onClick={() => {
                                if (!isActionDisabled) {
                                  navigate("/reschedule", { state: { appointment_id, personnel_id: booking.personnelId } });
                                }
                              }}
                              disabled={isActionDisabled}
                              title={isActionDisabled ? "Cannot reschedule - service in progress or completed" : "Reschedule booking"}
                            >
                              Reschedule
                            </button>
                            <button
                              className={`flex-1 px-3 py-2.5 rounded font-semibold text-sm transition-colors ${
                                isActionDisabled || canceling || booking.status === "Declined"
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-red-100 text-red-700 hover:bg-red-200 active:scale-[0.98]"
                              }`}
                              onClick={() => {
                                if (!isActionDisabled) {
                                  handleCancelBooking();
                                }
                              }}
                              disabled={isActionDisabled || canceling || booking.status === "Declined"}
                              title={isActionDisabled ? "Cannot cancel - service in progress or completed" : "Cancel booking"}
                            >
                              {canceling ? "Cancelling..." : booking.status === "Declined" ? "Cancelled" : "Cancel"}
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Service Checklist */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-4 sm:px-5 py-3 border-b">
                    <div className="font-semibold text-sm sm:text-base">Service Checklist</div>
                  </div>

                  <ul className="p-4 sm:p-5 space-y-3 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Confirm your schedule date and time.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Keep your phone reachable for updates from the carwash boy.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Prepare vehicle and access if service is at your location.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Settle any remaining balance after the service.
                    </li>
                  </ul>

                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <div className="text-xs text-gray-500 mb-2">Need our help?</div>
                    {ownerPhone ? (
                      <a
                        href={`tel:${ownerPhone}`}
                        className="inline-flex items-center gap-2 px-3 py-2 border rounded bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
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
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-200 sticky top-20">
                  <div className="font-semibold text-base sm:text-lg mb-3">Payment Summary</div>

                  {/* Payment Status Badge */}
                  <div className="mb-3">
                    <span className="text-sm font-medium">Status:</span>
                    <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      latestPaymentStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : latestPaymentStatus === "Partial"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {latestPaymentStatus}
                    </span>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-gray-50 border rounded-lg p-3 sm:p-4 mb-4 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span>PHP {servicePrice}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Paid Amount</span>
                      <span className="text-green-600">PHP {paidAmount}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Remaining</span>
                      <span className="text-orange-600">PHP {remainingBalance > 0 ? remainingBalance : 0}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Partial (50%)</span>
                      <span>PHP {servicePrice / 2}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2 font-bold">
                      <span>Total Due</span>
                      <span>PHP {remainingBalance > 0 ? remainingBalance : 0}</span>
                    </div>
                  </div>

                  {/* Payment Buttons */}
                  <div className="space-y-2">
                    <button
                      className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                        isFullyPaid
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-green-500 text-white hover:bg-green-600 active:scale-[0.98]"
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
                    >
                      {isFullyPaid ? "Paid" : "Pay Now"}
                    </button>

                    {(() => {
                      const isCancelDisabled = 
                        statusIs(booking.status, "Halfway") || 
                        statusIs(booking.status, "On Going") || 
                        statusIs(booking.status, "Completed") ||
                        canceling || 
                        booking.status === "Declined";
                      
                      return (
                        <button
                          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                            isCancelDisabled
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-[0.98]"
                          }`}
                          onClick={() => {
                            if (!isCancelDisabled) {
                              handleCancelBooking();
                            }
                          }}
                          disabled={isCancelDisabled}
                        >
                          {canceling 
                            ? "Cancelling..." 
                            : booking.status === "Declined" 
                              ? "Cancelled" 
                              : "Request Cancellation"}
                        </button>
                      );
                    })()}

                    {/* Request Refund Button - Only show when Completed AND Paid */}
                    {statusIs(booking.status, "Completed") && isPaid && (
                      <button
                        className="w-full bg-red-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-600 flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                        onClick={() => setShowRefundModal(true)}
                      >
                        <FaUndo className="w-3 h-3" /> Request Refund
                      </button>
                    )}
                  </div>

                  {cancelSuccess && (
                    <div className="text-red-600 mt-3 font-semibold text-sm text-center">
                      Booking has been cancelled.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Book Again Button */}
            {booking.status === "Completed" && isPaid && (
              <button
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold mt-4 hover:bg-green-700 transition-colors active:scale-[0.98]"
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
        </main>
      </div>

      {/* Request Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <FaUndo className="text-base" /> Request a Refund
            </h2>
            <div className="mb-3 font-medium text-sm sm:text-base">
              Refund Amount: <span className="font-bold">PHP {paidAmount}</span>
            </div>
            <label className="block mb-2 font-medium text-sm">Reason for refund:</label>
            <textarea
              className="w-full border rounded-lg p-3 mb-4 text-sm"
              rows={3}
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              placeholder="Enter reason for refund..."
            />
            <div className="flex gap-3">
              <button
                className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={handleRequestRefund}
                disabled={refundLoading || !refundReason}
              >
                {refundLoading ? "Requesting..." : "Submit Request"}
              </button>
              <button
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
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
              <div className="text-green-600 mt-4 font-semibold text-sm text-center">
                Refund request submitted!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 w-full max-w-md">
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Rate {booking?.carwashName || "Carwash"}
            </h3>
            <div className="text-xs sm:text-sm text-gray-600 mb-4">
              {booking?.service_name || booking?.service || "Service"}
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 sm:gap-2 mb-4">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="text-2xl sm:text-3xl p-1"
                  title={`${n} star${n>1 ? "s" : ""}`}
                >
                  <span className={n <= rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-700">{rating}/5</span>
            </div>

            <textarea
              className="w-full border rounded-lg p-3 mb-4 text-sm"
              rows={3}
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-colors"
                onClick={() => {
                  localStorage.setItem(`feedback:${appointment_id}`, "1");
                  setShowFeedbackModal(false);
                }}
                disabled={submittingFeedback}
              >
                Skip
              </button>
              <button
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 transition-colors"
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