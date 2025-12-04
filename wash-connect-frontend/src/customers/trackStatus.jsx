import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt, FaSearch } from "react-icons/fa";
import { Menu, X, MoreVertical } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function TrackStatus() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const pageSize = 5;

  // Get user info
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

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

  const closeSidebar = () => setSidebarOpen(false);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Halfway":
        return "bg-yellow-100 text-yellow-700";
      case "Confirmed":
        return "bg-purple-100 text-purple-700";
      case "On Going":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-cyan-50 to-blue-100">
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
          {/* Track Status Tab - Active */}
          <div className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold cursor-pointer">
            <span className="mr-3 text-lg">🔎</span>
            Track Status
          </div>
          {/* Appointment Tab */}
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            onClick={() => {
              closeSidebar();
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
            Appointment
          </div>
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-red-50 text-gray-700 hover:text-red-600 cursor-pointer transition-colors"
            onClick={handleLogout}
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
            <h1 className="text-lg sm:text-xl font-semibold text-white">Track Status</h1>
          </div>
          
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg border border-blue-100">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-blue-700 text-center">
                Track Your Bookings
              </h2>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Enter Booking ID"
                    className="w-full border border-gray-300 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm sm:text-base"
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors text-sm font-medium"
                    onClick={() => setSearchId(searchId)}
                  >
                    Track
                  </button>
                  <button
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                    onClick={() => setSearchId("")}
                  >
                    My Bookings
                  </button>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Booking ID</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Service</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">📋</span>
                            <p>No bookings found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paged.map(b => (
                        <tr key={b.appointment_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">#{b.appointment_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{b.service_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {b.updated_at
                              ? b.updated_at.slice(0, 16).replace("T", " ")
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(b.status)}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {paged.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">📋</span>
                      <p>No bookings found.</p>
                    </div>
                  </div>
                ) : (
                  paged.map(b => (
                    <div 
                      key={b.appointment_id} 
                      className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-gray-200 rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-gray-500">Booking ID</span>
                          <p className="font-semibold text-gray-900">#{b.appointment_id}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(b.status)}`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500">Service</span>
                          <span className="text-sm font-medium text-gray-800">{b.service_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Updated</span>
                          <span className="text-sm text-gray-600">
                            {b.updated_at
                              ? b.updated_at.slice(0, 16).replace("T", " ")
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-100">
                <span className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                  {paged.length === 0 ? (
                    "No results"
                  ) : (
                    <>
                      Showing {(currentPage - 1) * pageSize + 1}-{(currentPage - 1) * pageSize + paged.length} of {sortedBookings.length}
                    </>
                  )}
                </span>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">←</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((n) => {
                        if (n === 1 || n === totalPages) return true;
                        if (Math.abs(n - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((n, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && n - prev > 1;
                        return (
                          <React.Fragment key={n}>
                            {showEllipsis && (
                              <span className="px-1 text-gray-400">...</span>
                            )}
                            <button
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-sm font-medium transition-colors ${
                                n === currentPage 
                                  ? "bg-cyan-500 text-white border-cyan-500" 
                                  : "bg-white border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() => setCurrentPage(n)}
                            >
                              {n}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}