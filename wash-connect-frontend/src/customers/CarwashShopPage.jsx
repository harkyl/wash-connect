import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaStar,
  FaHeart,
  FaCalendarAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { Search, MapPin, MoreVertical, Menu, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ReportModal from "./components/ReportModal";

const MAIN_LOCATIONS = ["All", "Cordova", "Cebu City", "Mandaue", "Lapu-Lapu"];

const placeholderLogo = "/default-logo.png";
const normalizeLogo = (raw) => {
  if (!raw) return placeholderLogo;
  const s = String(raw);
  if (s.startsWith("http")) return s;
  if (!s.startsWith("/")) return `http://localhost:3000/uploads/logos/${s}`;
  return `http://localhost:3000${s}`;
};

function HeaderMenuDropdown({ navigate }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="p-2 rounded-full hover:bg-white/20 transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
      >
        <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <button
              className="w-full text-left px-4 py-3 hover:bg-cyan-50 text-cyan-700 font-medium text-sm transition-colors"
              onClick={() => {
                setOpen(false);
                navigate("/feedback");
              }}
            >
              Give Feedback
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CarwashShopPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);
  const [shopRatings, setShopRatings] = useState({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportingShop, setReportingShop] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/carwash-applications/approved", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        const data = await res.json();
        setShops(Array.isArray(data) ? data : []);
      } catch {
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id || user.user_id;
    const token = localStorage.getItem("token");
    if (userId && token) {
      fetch(`http://localhost:3000/api/bookings/customers/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
        .then((res) => res.ok ? res.json() : [])
        .then((bookingsData) => {
          const latest = (bookingsData || []).find(
            (b) => !["Declined", "Cancelled", "Completed"].includes(b.status)
          );
          setActiveBooking(latest || null);
        })
        .catch(() => setActiveBooking(null));
    }
  }, []);

  // Fetch ratings for all shops after shops are loaded
  useEffect(() => {
    const token = localStorage.getItem("token");
    async function fetchRatings() {
      const ratings = {};
      for (const shop of shops) {
        try {
          const res = await fetch(
            `http://localhost:3000/api/reviews/${shop.applicationId}`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            }
          );
          const data = await res.json();
          ratings[shop.applicationId] =
            typeof data.avgRating === "number" ? data.avgRating : 0;
        } catch {
          ratings[shop.applicationId] = 0;
        }
      }
      setShopRatings(ratings);
    }
    if (shops.length > 0) fetchRatings();
  }, [shops]);

  const filteredShops = useMemo(() => {
    const byLocation = shops.filter((shop) => {
      if (selectedLocation === "All") return true;
      if (selectedLocation === "Other") {
        return !MAIN_LOCATIONS.slice(1).some((loc) =>
          (shop.location || "").toLowerCase().includes(loc.toLowerCase())
        );
      }
      return (shop.location || "").toLowerCase().includes(selectedLocation.toLowerCase());
    });
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byLocation;
    return byLocation.filter(
      (shop) =>
        (shop.carwashName || "").toLowerCase().includes(q) ||
        (shop.owner_first_name || "").toLowerCase().includes(q) ||
        (shop.owner_last_name || "").toLowerCase().includes(q)
    );
  }, [shops, selectedLocation, searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleReportShop = (shop) => {
    setReportingShop(shop);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportingShop(null);
  };

  const handleSubmitReport = (reason) => {
    if (!reportingShop) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      toast.error("Could not find user information. Please log in again.");
      return;
    }

    const reportPromise = fetch("http://localhost:3000/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        applicationId: reportingShop.applicationId,
        reason: reason,
        user_id: user.id,
      }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok) {
        return data.message || "Report submitted successfully!";
      } else {
        return Promise.reject(data.message || "Failed to submit report.");
      }
    });

    toast.promise(reportPromise, {
      loading: "Submitting report...",
      success: (message) => {
        handleCloseReportModal();
        return message;
      },
      error: (err) => {
        console.error("Report submission failed:", err);
        return err.toString();
      },
    });
  };

  const handleViewServices = (shop) => {
    localStorage.setItem("selectedApplicationId", String(shop.applicationId));
    navigate("/book", {
      state: { applicationId: shop.applicationId, carwashName: shop.carwashName },
    });
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#c7f1ff] to-[#e7f7ff]">
      {/* Toast */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#fff",
            color: "#333",
            border: "1px solid #a8d6ea",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            fontSize: "0.9rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
          },
          iconTheme: {
            primary: "#06b6d4",
            secondary: "#e0f7fa",
          },
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        onSubmit={handleSubmitReport}
        shop={reportingShop}
      />

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
          <div className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold cursor-pointer">
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
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            onClick={() => {
              closeSidebar();
              if (activeBooking) {
                navigate("/booking-confirmation", { state: { appointment_id: activeBooking.appointment_id } });
              } else {
                toast(
                  <div>
                    <span role="img" aria-label="calendar" style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>📅</span>
                    <span>No active appointment found.</span>
                  </div>,
                  { icon: "🚫" }
                );
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
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
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
            <h1 className="text-lg sm:text-xl font-semibold text-white">Find a Carwash</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Search */}
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search carwash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-white/40 bg-white/90 text-gray-700 focus:outline-none focus:ring-2 focus:ring-white/50 w-48 lg:w-64 text-sm"
              />
            </div>

            {/* Mobile Search Toggle */}
            <button
              className="md:hidden p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="w-5 h-5 text-white" />
            </button>

            {/* Profile icon with name - Hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-cyan-200">
              <FaUser className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                {userName || "User"}
              </span>
            </div>

            {/* Three dots menu */}
            <HeaderMenuDropdown navigate={navigate} />
          </div>
        </header>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden px-4 py-3 bg-white border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search carwash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
            {MAIN_LOCATIONS.concat("Other").map((loc) => (
              <button
                key={loc}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm border transition whitespace-nowrap flex-shrink-0 ${
                  selectedLocation === loc
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedLocation(loc)}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            {/* Results count - Mobile */}
            {!loading && filteredShops.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{filteredShops.length}</span> carwash{filteredShops.length !== 1 ? 'es' : ''} found
                  {selectedLocation !== "All" && ` in ${selectedLocation}`}
                </p>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="w-full h-32 sm:h-36 bg-gray-200 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded flex-1" />
                      <div className="h-8 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect width="20" height="2" x="2" y="6" rx="1" fill="currentColor" />
                    <rect width="20" height="2" x="2" y="11" rx="1" fill="currentColor" />
                    <rect width="20" height="2" x="2" y="16" rx="1" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">No Carwash Found</h3>
                <p className="text-gray-600 text-center max-w-md mb-6 text-sm sm:text-base">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : `There are currently no carwash companies registered in ${selectedLocation}. Try searching other areas.`
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                    Suggest a Carwash
                  </button>
                  <button
                    className="border border-cyan-500 text-cyan-700 px-6 py-3 rounded-lg hover:bg-cyan-50 transition-colors text-sm font-medium"
                    onClick={() => {
                      setSelectedLocation("All");
                      setSearchQuery("");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredShops.map((shop) => {
                  const logoUrl = normalizeLogo(shop.logo);
                  const avgRating = shopRatings[shop.applicationId];
                  return (
                    <div
                      key={shop.applicationId}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden flex flex-col group"
                    >
                      {/* Logo Container */}
                      <div className="w-full h-32 sm:h-36 lg:h-40 bg-gray-50 border-b border-gray-100 flex items-center justify-center overflow-hidden p-3">
                        <img
                          src={logoUrl}
                          alt={`${shop.carwashName} logo`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            if (e.currentTarget.src !== window.location.origin + placeholderLogo) {
                              e.currentTarget.src = placeholderLogo;
                            }
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-tight">
                            {shop.carwashName}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-700 bg-yellow-50 px-2 py-1 rounded-full flex-shrink-0">
                            <FaStar className="text-yellow-500 w-3 h-3" />
                            <span className="font-medium">
                              {typeof avgRating === "number" ? avgRating.toFixed(1) : "0.0"}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">{shop.location || "Location not specified"}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto flex gap-2">
                          <button
                            className="flex-1 bg-blue-600 text-white px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors active:scale-[0.98]"
                            onClick={() => handleViewServices(shop)}
                          >
                            View Services
                          </button>
                          <button
                            className="bg-red-50 text-red-600 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium border border-red-200 hover:bg-red-100 transition-colors active:scale-[0.98]"
                            onClick={() => handleReportShop(shop)}
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Custom scrollbar hide style */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default CarwashShopPage;
