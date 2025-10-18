import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast"; // Add this import if not present

export default function TrackStatus() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Fetch bookings for current user with token
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id || user.user_id;
    const token = localStorage.getItem("token");
    if (!userId || !token) return;
    fetch(`http://localhost:3000/api/bookings/customers/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((data) => setBookings(data || []));
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Filter for Completed, On Going, and Halfway bookings first
  const filteredBookings = bookings.filter(
    (b) => ["Completed", "On Going", "Halfway"].includes(b.status)
  );

  // Apply search filter
  const searchedBookings = searchId.trim()
    ? filteredBookings.filter(b => String(b.appointment_id).includes(searchId.trim()))
    : filteredBookings;

  // Sort by updated_at descending (latest first)
  const sortedBookings = [...searchedBookings].sort((a, b) => {
    if (a.updated_at && b.updated_at) {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }
    return (b.appointment_id || 0) - (a.appointment_id || 0);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedBookings.length / pageSize));
  const paged = sortedBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-cyan-50 to-blue-100">
      <Toaster position="top-right" /> {/* Add this line at the top level of your component */}
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col min-h-screen shadow-lg">
        <div className="flex items-center px-8 py-8 border-b border-gray-100">
          <span className="text-3xl" style={{ fontFamily: "Brush Script MT, cursive" }}>
            <span className="text-cyan-500">Wash</span>{" "}
            <span className="text-red-500">Connect</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => navigate("/user-dashboard")}
          >
            <FaUser className="mr-3 w-5 h-5" />
            Account
          </div>
          <div className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => navigate("/popular-carwash")}
          >
            <FaStar className="mr-3 w-5 h-5" />
            Carwash Shops
          </div>
          <div className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer" 
            onClick={() => navigate("/book")}
          >
            <FaHeart className="mr-3 w-5 h-5" />
            Services
          </div>
          {/* Track Status Tab */}
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold cursor-pointer"
            onClick={() => navigate("/track-status")}
          >
            <span className="text-xl">🔎</span>
            <span className="text-gray-700">Track Status</span>
          </div>
          {/* Appointment Tab */}
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => {
              // Find the first active booking (not Declined, Cancelled, Completed)
              const activeBooking = bookings.find(
                (b) => !["Declined", "Cancelled", "Completed"].includes(b.status)
              );
              if (activeBooking) {
                navigate("/booking-confirmation", { state: { appointment_id: activeBooking.appointment_id } });
              } else {
                toast("No active appointment found.", { icon: "📅" });
              }
            }}
          >
            <FaCalendarAlt className="mr-3 w-5 h-5" />
            <span className="text-gray-700">Appointment</span>
          </div>
          <div className="mt-auto px-4 pt-8">
            <div
              className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="mr-3 w-5 h-5" />
              <span className="text-gray-700">LogOut</span>
            </div>
          </div>
        </nav>
      </div>
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">
            Track Status
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter Booking ID"
              className="border px-3 py-2 rounded w-64"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
            />
            <button
              className="border px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              onClick={() => setSearchId(searchId)}
            >
              Track
            </button>
            <button
              className="border px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              onClick={() => setSearchId("")}
            >
              My Bookings
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border mb-2">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2">Booking ID</th>
                  <th className="border px-4 py-2">Service</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Status</th>
                  {/* Removed Actions column */}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">No bookings found.</td>
                  </tr>
                ) : (
                  paged.map(b => (
                    <tr key={b.appointment_id}>
                      <td className="border px-4 py-2">{b.appointment_id}</td>
                      <td className="border px-4 py-2">{b.service_name}</td>
                      <td className="border px-4 py-2">
                        {b.updated_at
                          ? b.updated_at.slice(0, 16).replace("T", " ")
                          : ""}
                      </td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          b.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : b.status === "Halfway"
                            ? "bg-yellow-100 text-yellow-700"
                            : b.status === "Confirmed"
                            ? "bg-purple-100 text-purple-700"
                            : b.status === "On Going"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      {/* Removed Actions button cell */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} · Showing {paged.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{(currentPage - 1) * pageSize + paged.length} of {sortedBookings.length}
            </span>
            <button
              className="border px-2 py-1 rounded disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="border px-2 py-1 rounded disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}