import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaRegEnvelope, FaRegEye, FaRegCheckSquare, FaTrophy, FaRegFolderOpen, FaPlay, FaFlagCheckered } from "react-icons/fa"; // + icons
import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  { key: "overall", label: "Overall Booking" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "ongoing", label: "On Going" },
  { key: "completed", label: "Completed" }, // <-- Added Completed tab
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
        {/* Status Update tab below Customers & Employee */}
        <button
          className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
          onClick={() => navigate("/status-update")}
        >
          <FaRegCheckSquare className="text-lg" />
          <span>Status Update</span>
        </button>
        {/* Manage Bookings */}
        <button
          className={`flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left ${
            location.pathname === "/bookings"
              ? "bg-blue-100 text-blue-700 font-semibold"
              : ""
          }`}
          onClick={() => navigate("/bookings")}
        >
          <FaRegCheckSquare className="text-lg" />
          <span>Manage Bookings</span>
        </button>
        <div className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200"
          onClick={() => navigate("/booking-history")}
        >
          <FaRegCheckSquare className="text-lg" />
          <span>Booking History</span>
        </div>
        <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/earning-dashboard')}>
          <FaTrophy className="text-lg" />
          <span>Earnings Dashboard</span>
        </div>
        {/* Add Refund Request below Earnings Dashboard */}
        <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/refund-request')}>
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const owner = JSON.parse(localStorage.getItem("carwashOwner"));
    const token = localStorage.getItem("token");
    if (!owner || !owner.id || !token) {
      navigate("/carwash-login");
      return;
    }

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
      .then(data => {
        if (data && data.applicationId) {
          setApplicationId(data.applicationId);
          // Fetch ALL bookings for this applicationId
          fetch(`http://localhost:3000/api/bookings/application/${data.applicationId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => {
              if (res.status === 401) {
                navigate("/carwash-login");
                return [];
              }
              return res.ok ? res.json() : [];
            })
            .then(data => setBookings(Array.isArray(data) ? data : []))
            .catch(() => setBookings([]));
        }
      })
      .catch(() => setBookings([]));
  }, [navigate]);

  // Update rules
  const BLOCKED_STATUSES = new Set(["Declined", "Completed", "Refunded"]);
  const canUpdate = (status) => status === "Confirmed" || status === "Halfway";
  const nextOptionsFor = (status) => {
    if (status === "Confirmed") return ["Halfway"];
    if (status === "Halfway") return ["Completed"];
    return [];
  };

  // Accept booking (still allowed from Pending)
  const handleAccept = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/api/bookings/confirm/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
    setBookings(prev => prev.map(b => b.appointment_id === id ? { ...b, status: "Confirmed" } : b));
  };

  // Decline booking (still allowed from Pending)
  const handleDecline = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:3000/api/bookings/decline/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});
    setBookings(prev => prev.filter(b => b.appointment_id !== id));
  };

  // Strict status updater: only Confirmed->Halfway, Halfway->Completed
  const updateBookingStatus = async (id, newStatus) => {
    const current = bookings.find(b => b.appointment_id === id);
    if (!current) return;

    // Blocked statuses cannot be updated
    const BLOCKED_STATUSES = new Set(["Declined", "Completed", "Refunded"]);
    if (BLOCKED_STATUSES.has(current.status)) return;

    // Only allow from Confirmed or Halfway, and only to their next statuses
    const canUpdate = (s) => s === "Confirmed" || s === "Halfway";
    const nextOptionsFor = (s) => (s === "Confirmed" ? ["Halfway"] : s === "Halfway" ? ["Completed"] : []);
    const allowedNext = nextOptionsFor(current.status);
    if (!canUpdate(current.status) || !allowedNext.includes(newStatus)) return;

    const token = localStorage.getItem("token");
    // FIX: call the correct backend endpoint + payload
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

    setBookings(prev =>
      prev.map(b => (b.appointment_id === id ? { ...b, status: newStatus } : b))
    );
  };

  // Filter bookings by tab (add completed logic)
  const filteredBookings = bookings.filter(b => {
    if (activeTab === "overall") return true;
    if (activeTab === "pending") return b.status === "Pending" || b.status === "Pending Approval";
    if (activeTab === "ongoing") return b.status === "On Going";
    if (activeTab === "confirmed") return b.status === "Confirmed";
    if (activeTab === "completed") return b.status === "Completed"; // <-- Completed filter
    return true;
  });

  // Get bookings for a customer that match the current tab (add completed logic)
  const getBookingsForCustomer = (customerId) =>
    bookings.filter(b => {
      if (b.customer_id !== customerId) return false;
      if (activeTab === "overall") return true;
      if (activeTab === "pending") return b.status === "Pending" || b.status === "Pending Approval";
      if (activeTab === "ongoing") return b.status === "On Going";
      if (activeTab === "confirmed") return b.status === "Confirmed";
      if (activeTab === "completed") return b.status === "Completed"; // <-- Completed filter
      return true;
    });

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
          {filteredBookings.length === 0 ? (
            <div className="text-center text-gray-400">No bookings found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.map(booking => {
                const status = booking.status;
                const showQuickSelect = canUpdate(status);
                const nextOptions = nextOptionsFor(status);

                return (
                  <div key={booking.appointment_id} className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col gap-2 shadow">
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
                    </div>

                    {/* Quick status dropdown: only for Confirmed/Halfway */}
                    {showQuickSelect ? (
                      <div className="mt-1">
                        <select
                          className="w-full border rounded p-1 text-xs"
                          value={status}
                          onChange={(e) => updateBookingStatus(booking.appointment_id, e.target.value)}
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
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Service:</span>
                      <span className="ml-1">{booking.service_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Date:</span>
                      <span className="ml-1">
                        {booking.schedule_date
                          ? new Date(booking.schedule_date).toLocaleDateString()
                          : "N/A"}
                        {booking.schedule_time && (
                          <span className="ml-2">| Time: {booking.schedule_time}</span>
                        )}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      {(status === "Pending" || status === "Pending Approval") && (
                        <>
                          <button
                            className="flex-1 bg-blue-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-blue-600"
                            onClick={() => handleAccept(booking.appointment_id)}
                          >
                            Accept
                          </button>
                          <button
                            className="flex-1 bg-red-100 text-red-700 rounded px-3 py-1 text-xs font-medium hover:bg-red-600 hover:text-white"
                            onClick={() => handleDecline(booking.appointment_id)}
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {/* Only Confirmed and Halfway can be updated */}
                      {status === "Confirmed" && (
                        <button
                          className="flex-1 bg-yellow-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-yellow-600"
                          onClick={() => updateBookingStatus(booking.appointment_id, "Halfway")}
                        >
                          Set Halfway
                        </button>
                      )}

                      {status === "Halfway" && (
                        <button
                          className="flex-1 bg-green-500 text-white rounded px-3 py-1 text-xs font-medium hover:bg-green-600 flex items-center justify-center gap-1"
                          onClick={() => updateBookingStatus(booking.appointment_id, "Completed")}
                        >
                          <FaFlagCheckered /> Complete
                        </button>
                      )}
                    </div>

                    <button
                      className="mt-2 text-blue-500 text-xs underline"
                      onClick={() => setSelectedCustomer(booking.customer_id)}
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {/* Modal for customer bookings */}
          {selectedCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                  onClick={() => setSelectedCustomer(null)}
                >
                  &times;
                </button>
                <h2 className="text-lg font-semibold mb-2">Customer Bookings</h2>
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {getBookingsForCustomer(selectedCustomer).map(b => (
                    <li key={b.appointment_id} className="border-b pb-2">
                      <div className="font-medium">{b.service_name}</div>
                      <div className="text-xs text-gray-500">
                        {b.schedule_date
                          ? new Date(b.schedule_date).toLocaleDateString()
                          : "N/A"}
                        {b.schedule_time && (
                          <span className="ml-2">
                            | Time: {b.schedule_time}
                          </span>
                        )}
                      </div>
                      <div className="text-xs">{b.status}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bookings;