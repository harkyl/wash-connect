import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaRegEye, FaRegCheckSquare, FaTrophy, FaRegFolderOpen, FaFlagCheckered } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  { key: "overall", label: "Overall Booking" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "halfway", label: "Halfway" },
  { key: "ongoing", label: "On Going" },
  { key: "completed", label: "Completed" },
];

// Sidebar component (inline)
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r flex flex-col h-screen">
      <div className="px-6 py-8">
        <div className="text-3xl flex items-center select-none">
          <span className="text-gray-700" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}>
            Wash
          </span>
          <span className="ml-2 text-red-500 font-semibold" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}>
            Connect
          </span>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 ${
            location.pathname === "/carwash-dashboard"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "hover:bg-gray-100 cursor-pointer"
          }`}
          onClick={() => navigate("/carwash-dashboard")}
        >
          <FaRegEye /> Overview
        </button>

        <button
          className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 ${
            location.pathname === "/customer-list"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "hover:bg-gray-100 cursor-pointer"
          }`}
          onClick={() => navigate("/customer-list")}
        >
          <span className="text-lg">★</span> Customers & Employee
        </button>

        {/* Horizontal line below "Customers & Employee" */}
        <hr className="my-3 border-t border-gray-200 w-full" />

        <button
          className={`flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left ${
            location.pathname === "/bookings" ? "bg-blue-100 text-blue-700 font-semibold" : ""
          }`}
          onClick={() => navigate("/bookings")}
        >
          <FaRegCheckSquare className="text-lg" />
          <span>Manage Bookings</span>
        </button>

        <div
          className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200"
          onClick={() => navigate("/booking-history")}
        >
          <FaRegCheckSquare className="text-lg" />
          <span>Booking History</span>
        </div>

        <div
          className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200"
          onClick={() => navigate("/earning-dashboard")}
        >
          <FaTrophy className="text-lg" />
          <span>Earnings Dashboard</span>
        </div>

        <div
          className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200"
          onClick={() => navigate("/refund-request")}
        >
          <FaRegFolderOpen className="text-lg" />
          <span>Request Refund</span>
        </div>

        <hr className="my-4 border-gray-300" />
      </nav>

      <div className="mt-auto px-4 py-6">
        <button
          className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("carwashOwner");
            navigate("/carwash-login");
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

function Bookings() {
  const [activeTab, setActiveTab] = useState("overall");
  const [bookings, setBookings] = useState([]);
  const [, setApplicationId] = useState(null);
  const navigate = useNavigate();

  // Pagination state (10 per page)
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when tab or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, bookings]);

  // Helper to tolerate different booking id fields
  const getBookingId = (b) => b?.appointment_id || b?.id || b?.appointmentId || null;

  // Parse schedule date/time to a Date
  const parseDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;

    if (timeStr && typeof timeStr === "string") {
      const t = timeStr.trim();
      let m;
      // e.g., 3:05 PM or 11:20:10 am
      if ((m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i))) {
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const sec = m[3] ? parseInt(m[3], 10) : 0;
        const ampm = m[4].toUpperCase();
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        d.setHours(h, min, sec, 0);
      }
      // e.g., 15:05 or 15:05:30
      else if ((m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/))) {
        const h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const sec = m[3] ? parseInt(m[3], 10) : 0;
        d.setHours(h, min, sec, 0);
      }
    }
    return d;
  };

  // Comparable timestamp for sorting (newest first)
  const toComparableTs = (b) => {
    const dt = parseDateTime(b?.schedule_date, b?.schedule_time);
    if (dt) return dt.getTime();

    const created = b?.created_at || b?.createdAt || b?.created_date || b?.createdDate;
    if (created) {
      const cdt = new Date(created);
      if (!Number.isNaN(cdt.getTime())) return cdt.getTime();
    }

    // Fallback to numeric id
    const id = Number(getBookingId(b));
    return Number.isFinite(id) ? id : 0;
  };

  // Fetch booking detail (try personnel-rich endpoint first, then fallback)
  const fetchBookingDetail = async (appointmentId, token) => {
    if (!appointmentId || !token) return null;
    const headers = { Authorization: `Bearer ${token}` };
    const tryUrls = [
      `http://localhost:3000/api/bookings/with-personnel/${appointmentId}`, // if backend exposes this
      `http://localhost:3000/api/bookings/${appointmentId}` // fallback
    ];
    for (const url of tryUrls) {
      try {
        const res = await fetch(url, { headers });
        if (!res || !res.ok) continue;
        const det = await res.json();
        // normalize personnel fields onto booking object
        const assignedName =
          det.assigned_employee_name ||
          det.carwash_boy_name ||
          det.attendant_name ||
          (det.personnel_first_name ? `${det.personnel_first_name} ${det.personnel_last_name || ""}`.trim() : null) ||
          det.personnel_name ||
          null;
        const assignedContact =
          det.assigned_employee_contact ||
          det.carwash_boy_contact ||
          det.attendant_contact ||
          det.personnel_email ||
          det.personnel_contact ||
          null;
        return {
          ...det,
          assigned_employee_name: assignedName || det.assigned_employee_name || det.carwash_boy_name || det.attendant_name || det.personnel_first_name ? `${det.personnel_first_name} ${det.personnel_last_name || ""}`.trim() : det.assigned_employee_name,
          assigned_employee_contact: assignedContact || det.assigned_employee_contact || det.carwash_boy_contact || det.attendant_contact || det.personnel_email,
        };
      } catch {
        // try next url
      }
    }
    return null;
  };

  useEffect(() => {
    const owner = JSON.parse(localStorage.getItem("carwashOwner") || "null");
    const token = localStorage.getItem("token");
    if (!owner || !owner.id || !token) {
      navigate("/carwash-login");
      return;
    }

    // fetch application id then bookings; then fetch booking detail to get assigned personnel
    fetch(`http://localhost:3000/api/carwash-applications/by-owner/${owner.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          navigate("/carwash-login");
          return null;
        }
        return res.json();
      })
      .then(async data => {
        if (data && data.applicationId) {
          setApplicationId(data.applicationId);

          const bookingsRes = await fetch(`http://localhost:3000/api/bookings/application/${data.applicationId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);

          if (!bookingsRes) {
            setBookings([]);
            return;
          }
          if (bookingsRes.status === 401) {
            navigate("/carwash-login");
            setBookings([]);
            return;
          }

          const bookingsData = await (bookingsRes.ok ? bookingsRes.json() : []);
          if (!Array.isArray(bookingsData)) {
            setBookings([]);
            return;
          }

          // fetch detailed booking for assigned personnel (in parallel)
          const detailed = await Promise.all(bookingsData.map(async b => {
            const id = getBookingId(b);
            if (!id) return b;
            const det = await fetchBookingDetail(id, token);
            return det ? { ...b, ...det } : b;
          }));

          setBookings(detailed);
        }
      })
      .catch(() => setBookings([]));
  }, [navigate]);

  const BLOCKED_STATUSES = new Set(["Declined", "Completed", "Refunded"]);
  const canUpdate = (status) => status === "Confirmed" || status === "On Going" || status === "Halfway";

  const nextOptionsFor = (status) => {
    if (status === "Confirmed") return ["On Going"];
    if (status === "On Going") return ["Halfway"];
    if (status === "Halfway") return ["Completed"];
    return [];
  };

  const handleAccept = async (id) => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`http://localhost:3000/api/bookings/confirm/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});

    // optimistic + re-fetch detail to get assigned personnel if backend assigned
    setBookings(prev => prev.map(b => (getBookingId(b) === id ? { ...b, status: "Confirmed" } : b)));
    try {
      const det = await fetchBookingDetail(id, token);
      if (det) {
        setBookings(prev => prev.map(b => (getBookingId(b) === id ? { ...b, ...det } : b)));
      }
    } catch {
      // Intentionally left empty
    }
  };

  const handleDecline = async (id) => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch(`http://localhost:3000/api/bookings/decline/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});

    // Do not remove booking immediately. mark Declined and merge latest detail.
    setBookings(prev => prev.map(b => (getBookingId(b) === id ? { ...b, status: "Declined" } : b)));
    try {
      const det = await fetchBookingDetail(id, token);
      if (det) {
        setBookings(prev => prev.map(b => (getBookingId(b) === id ? { ...b, ...det } : b)));
      }
    } catch {
      // Intentionally left empty
    }
  };

  const updateBookingStatus = async (id, newStatus) => {
    if (!id) return;
    const current = bookings.find(b => getBookingId(b) === id);
    if (!current) return;

    if (BLOCKED_STATUSES.has(current.status)) return;

    const allowedNext = nextOptionsFor(current.status);
    if (!canUpdate(current.status) || !allowedNext.includes(newStatus)) return;

    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`http://localhost:3000/api/bookings/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentId: id, new_status: newStatus, reason: "" }),
    });

    if (!res.ok) {
      console.error("Failed to update booking status", res.status);
      return;
    }

    // update local status immediately
    setBookings(prev => prev.map(b => (getBookingId(b) === id ? { ...b, status: newStatus } : b)));

    // re-fetch the specific booking detail to get latest personnel assignment and merge
    try {
      const det = await fetchBookingDetail(id, token);
      if (det) {
        setBookings(prev => prev.map(b => (getBookingId(b) === id ? { ...b, ...det } : b)));
      }
    } catch {
      // ignore
    }
  };

  const paymentBadgeClass = (ps) => {
    switch (ps) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Partial":
        return "bg-yellow-100 text-yellow-700";
      case "Refunded":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const HIDE_PAYMENT_FOR = new Set(["Cancelled", "Declined", "Canceled"]);

  // Filter then sort (newest first), then paginate
  const filteredBookings = bookings.filter(b => {
    if (activeTab === "overall") return true;
    if (activeTab === "pending") return b.status === "Pending" || b.status === "Pending Approval";
    if (activeTab === "halfway") return b.status === "Halfway";
    if (activeTab === "ongoing") return b.status === "On Going";
    if (activeTab === "confirmed") return b.status === "Confirmed";
    if (activeTab === "completed") return b.status === "Completed";
    return true;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) => toComparableTs(b) - toComparableTs(a));

  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const paginatedBookings = sortedBookings.slice(startIdx, endIdx);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-between px-8 py-6 bg-blue-100 border-b">
          <h1 className="text-2xl font-semibold">Manage Bookings</h1>
        </div>

        <div className="flex gap-4 px-8 py-4 bg-white border-b">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded font-semibold ${activeTab === tab.key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {paginatedBookings.length === 0 ? (
            <div className="text-center text-gray-400">No bookings found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedBookings.map((booking, idx) => {
                  const status = booking.status;
                  const showQuickSelect = canUpdate(status);
                  const nextOptions = nextOptionsFor(status);

                  // Determine attendant fields (merged from booking detail if available)
                  const attendantName = booking.assigned_employee_name || booking.carwash_boy_name || booking.attendant_name || (booking.personnel_first_name ? `${booking.personnel_first_name} ${booking.personnel_last_name || ""}`.trim() : "") || "";
                  const attendantContact = booking.assigned_employee_contact || booking.carwash_boy_contact || booking.attendant_contact || booking.personnel_email || "";

                  const id = getBookingId(booking);
                  const key = id ?? `pg-${page}-row-${idx}`;

                  return (
                    <div key={key} className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2 shadow">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={booking.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.customer_first_name || "")}`}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover border"
                        />
                        <div>
                          <div className="font-semibold text-lg">{booking.customer_first_name} {booking.customer_last_name}</div>
                          <div className="text-xs text-gray-500">{booking.customer_email}</div>
                        </div>

                        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                          status === "Pending" || status === "Pending Approval"
                            ? "bg-yellow-100 text-yellow-700"
                            : status === "Approved"
                            ? "bg-blue-100 text-blue-700"
                            : status === "On Going"
                            ? "bg-orange-100 text-orange-700"
                            : status === "Halfway"
                            ? "bg-purple-100 text-purple-700"
                            : status === "Confirmed"
                            ? "bg-green-100 text-green-700"
                            : status === "Completed"
                            ? "bg-gray-200 text-gray-700"
                            : status === "Declined" || status === "Refunded"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {status}
                        </span>

                        {booking.payment_status && !HIDE_PAYMENT_FOR.has(status) && (
                          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${paymentBadgeClass(booking.payment_status)}`}>
                            {booking.payment_status}
                          </span>
                        )}
                      </div>

                      {showQuickSelect ? (
                        <div className="mt-1">
                          <select
                            className="w-full border rounded p-1 text-xs"
                            value={status}
                            onChange={(e) => id && updateBookingStatus(id, e.target.value)}
                            disabled={!id}
                          >
                            <option value={status} disabled>{status}</option>
                            {nextOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <select className="w-full border rounded p-1 text-xs bg-gray-50 text-gray-400" value={status} disabled>
                            <option>{status}</option>
                          </select>
                        </div>
                )}

                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <FaMapMarkerAlt className="mr-1" /> {booking.address}
                      </div>

                      <div className="flex flex-col text-sm text-gray-600 mb-1">
                        <div>
                          <span className="font-semibold">Service:</span>
                          <span className="ml-1">{booking.service_name}</span>
                        </div>

                        {/* Vehicle Type */}
                        <div className="mt-1">
                          <span className="font-semibold">Vehicle:</span>
                          <span className="ml-2">
                            {booking.vehicle_type || booking.vehicleType || "Motorcycle"}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold">Vehicle Model:</span>
                          <span className="ml-2">
                            {booking.vehicle_model || booking.vehicleModel || "N/A"}
                          </span>
                        </div>
                        {/* Display assigned carwash boy (attendant) directly under service */}
                        <div className="mt-1">
                          <span className="font-semibold">Attendant:</span>
                          {attendantName ? (
                            <span className="ml-2 text-sm text-gray-700">
                              {attendantName}
                              {attendantContact && <span className="ml-2 text-xs text-gray-500">| {attendantContact}</span>}
                            </span>
                          ) : (
                            <span className="ml-2 text-sm text-gray-500">No attendant assigned yet.</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <span className="font-semibold">Date:</span>
                        <span className="ml-1">
                          {booking.schedule_date ? new Date(booking.schedule_date).toLocaleDateString() : "N/A"}
                          {booking.schedule_time && <span className="ml-2">| Time: {booking.schedule_time}</span>}
                        </span>
                      </div>

                      {!HIDE_PAYMENT_FOR.has(status) && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <span className="font-semibold">Payment:</span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${paymentBadgeClass(booking.payment_status)}`}>
                            {booking.payment_status || "N/A"}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        {(status === "Pending" || status === "Pending Approval") && (
                          <>
                            <button
                              className="flex-1 bg-blue-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-blue-600 disabled:opacity-50"
                              onClick={() => id && handleAccept(id)}
                              disabled={!id}
                            >
                              Accept
                            </button>
                            <button
                              className="flex-1 bg-red-100 text-red-700 rounded px-3 py-1 text-xs font-medium hover:bg-red-600 hover:text-white disabled:opacity-50"
                              onClick={() => id && handleDecline(id)}
                              disabled={!id}
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {status === "Confirmed" && (
                          <button
                            className="flex-1 bg-orange-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-orange-600 disabled:opacity-50"
                            onClick={() => id && updateBookingStatus(id, "On Going")}
                            disabled={!id}
                          >
                            Start On Going
                          </button>
                        )}

                        {status === "On Going" && (
                          <button
                            className="flex-1 bg-yellow-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-yellow-600 disabled:opacity-50"
                            onClick={() => id && updateBookingStatus(id, "Halfway")}
                            disabled={!id}
                          >
                            Set Halfway
                          </button>
                        )}

                        {status === "Halfway" && (
                          <button
                            className="flex-1 bg-green-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-green-600 flex items-center justify-center gap-1 disabled:opacity-50"
                            onClick={() => id && updateBookingStatus(id, "Completed")}
                            disabled={!id}
                          >
                            <FaFlagCheckered /> Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing {sortedBookings.length === 0 ? 0 : startIdx + 1}-{Math.min(endIdx, sortedBookings.length)} of {sortedBookings.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
                  <button
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bookings;