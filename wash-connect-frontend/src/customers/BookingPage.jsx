import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Menu, X, MoreVertical } from "lucide-react";
import { FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt, FaSearch } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";

function BookingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const carwashName = location.state?.carwashName || "Carwash";

    // Persist applicationId so refresh still works
    const passedAppId = location.state?.applicationId;
    const [applicationId, setApplicationId] = useState(
        (passedAppId ?? localStorage.getItem("selectedApplicationId") ?? "").toString()
    );
    useEffect(() => {
        if (passedAppId && String(passedAppId) !== localStorage.getItem("selectedApplicationId")) {
            localStorage.setItem("selectedApplicationId", String(passedAppId));
            setApplicationId(String(passedAppId));
        }
    }, [passedAppId]);

    const [selectedSort, setSelectedSort] = useState("New");
    const [search, setSearch] = useState("");
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [activeBooking, setActiveBooking] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // fetched services
    const [fetchedServices, setFetchedServices] = useState([]);
    const [svcLoading, setSvcLoading] = useState(false);

    // NEW: pagination (max 6 per page)
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const safeGetUser = () => {
        try {
            const raw = localStorage.getItem("user");
            if (!raw) return {};
            return JSON.parse(raw) || {};
        } catch {
            return {};
        }
    };
    const user = safeGetUser();
    const userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) navigate("/login");
    }, [navigate]);

    // Load active appointment
    useEffect(() => {
        const user = safeGetUser();
        const userId = user.id || user.user_id;
        const token = localStorage.getItem("token");
        if (!userId || !token) return;

        fetch(`http://localhost:3000/api/bookings/customers/${userId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
            .then((res) => res.ok ? res.json() : Promise.reject())
            .then((bookings) => {
                const active = Array.isArray(bookings)
                    ? bookings.find((b) => !["Declined", "Cancelled", "Completed"].includes(b.status))
                    : null;
                setHasActiveBooking(!!active);
                setActiveBooking(active || null);
            })
            .catch(() => {
                // ignore
            });
    }, []);

    // Fetch services by applicationId
    useEffect(() => {
        if (!applicationId) {
            setFetchedServices([]);
            return;
        }

        const ctrl = new AbortController();
        setSvcLoading(true);

        const token = localStorage.getItem("token");
        fetch(`http://localhost:3000/api/services/by-application/${applicationId}`, {
            signal: ctrl.signal,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
            .then((res) => (res.ok ? res.json() : Promise.resolve([])))
            .then((rows) => {
                const list = Array.isArray(rows) ? rows : [];
                const mapped = list.map((s) => {
                    // Normalize image URL
                    const raw = String(s.image_url || s.img || "");
                    let img = "https://via.placeholder.com/400x300?text=Service";
                    if (raw) {
                        img = raw.startsWith("http")
                            ? raw
                            : `http://localhost:3000/${raw.replace(/^\/?/, "")}`;
                    }
                    const priceNum = Number(s.price ?? 0);
                    return {
                        id: s.serviceId ?? s.service_id ?? s.id ?? `${s.name}-${priceNum}`,
                        name: s.name ?? "Service",
                        price: Number.isFinite(priceNum) ? priceNum : 0,
                        img,
                    };
                });
                setFetchedServices(mapped);
            })
            .catch((err) => {
                if (err?.name !== "AbortError") {
                    toast.error("Could not load services.");
                    setFetchedServices([]);
                }
            })
            .finally(() => setSvcLoading(false));

        return () => ctrl.abort();
    }, [applicationId]);

    // Reset to page 1 when filters/data change
    useEffect(() => {
        setCurrentPage(1);
    }, [applicationId, search, selectedSort, fetchedServices.length]);

    // Use only fetched services
    const filteredServices = fetchedServices
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (selectedSort === "Price ascending") return a.price - b.price;
            if (selectedSort === "Price descending") return b.price - a.price;
            return 0;
        });

    // NEW: slice for current page
    const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    const pagedServices = filteredServices.slice(start, start + pageSize);

    const formatPHP = (v) => `₱${Number(v ?? 0).toLocaleString("en-PH")}`;

    const handleBookNow = (service) => {
        if (hasActiveBooking) {
            toast.error("You already have an active booking. Complete or cancel it first.");
            return;
        }
        if (!location.state?.carwashName) {
            toast("Please choose a carwash shop first!", { icon: "🧼" });
            navigate("/popular-carwash");
            return;
        }
        const user = safeGetUser();
        navigate("/book-form", {
            state: {
                applicationId,
                carwashName,
                serviceName: service.name,
                servicePrice: service.price,
                serviceImg: service.img,
                firstName: user.first_name || "",
                lastName: user.last_name || "",
                email: user.email || "",
                address: user.address || "",
            },
        });
    };

    const handleTrackStatus = async () => {
        navigate("/track-status");
    };

    const [menuOpen, setMenuOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-[#c8f1ff] to-[#e6f7ff]">
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
                    <div className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold cursor-pointer">
                        <FaHeart className="mr-3 w-5 h-5" />
                        Services
                    </div>
                    <div
                        className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
                        onClick={() => { closeSidebar(); handleTrackStatus(); }}
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
                                toast("No active appointment found. Please book a service first!", { icon: "📅" });
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
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#7cc3e2] to-[#a8d6ea] border-b border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Mobile Menu Button */}
                        <button 
                            className="lg:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5 text-white" />
                        </button>
                        <h1 className="text-base sm:text-xl font-semibold text-white truncate">
                            {carwashName} Services
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Mobile Search Toggle */}
                        <button
                            className="sm:hidden p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            onClick={() => setShowMobileSearch(!showMobileSearch)}
                        >
                            <FaSearch className="w-4 h-4 text-white" />
                        </button>
                        
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

                {/* Mobile Search Bar */}
                {showMobileSearch && (
                    <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-200">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search services..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* Active appointment banner */}
                {hasActiveBooking && (
                    <div className="px-4 sm:px-8 py-3 bg-amber-50 text-amber-800 text-xs sm:text-sm border-b border-amber-200">
                        <span className="font-medium">⚠️ Active booking:</span> Complete or cancel it before booking another.
                    </div>
                )}

                {/* Filters */}
                <div className="px-4 sm:px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* Desktop Search */}
                        <div className="hidden sm:block relative flex-1 max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search services"
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <label className="text-sm text-gray-600 whitespace-nowrap">Sort by</label>
                            <select
                                className="flex-1 sm:flex-none border border-gray-300 rounded-full px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                value={selectedSort}
                                onChange={(e) => setSelectedSort(e.target.value)}
                            >
                                <option>New</option>
                                <option>Price ascending</option>
                                <option>Price descending</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Services Grid */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header with count */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4 sm:mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Available Services</h2>
                                {!svcLoading && (
                                    <p className="text-sm text-gray-500">
                                        {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
                                    </p>
                                )}
                            </div>
                            {applicationId && !svcLoading && fetchedServices.length === 0 && (
                                <div className="text-sm text-gray-500">No services found for this carwash.</div>
                            )}
                        </div>

                        {/* Loading State */}
                        {svcLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                                        <div className="w-full h-36 sm:h-40 bg-gray-200" />
                                        <div className="p-4">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                                            <div className="h-10 bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredServices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FaHeart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Services Found</h3>
                                <p className="text-gray-500 text-center max-w-sm text-sm">
                                    {search 
                                        ? `No results for "${search}". Try a different search.`
                                        : "No services available for this carwash yet."
                                    }
                                </p>
                                {search && (
                                    <button
                                        className="mt-4 text-cyan-600 font-medium hover:underline text-sm"
                                        onClick={() => setSearch("")}
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Services Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {pagedServices.map((service) => (
                                        <div
                                            key={service.id}
                                            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden"
                                        >
                                            {/* Image Container */}
                                            <div className="relative">
                                                <div className="w-full h-36 sm:h-40 bg-gray-50 overflow-hidden">
                                                    <img
                                                        src={service.img}
                                                        alt={service.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Service";
                                                        }}
                                                    />
                                                </div>
                                                <span className="absolute top-2 right-2 bg-white/95 backdrop-blur text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                                    {formatPHP(service.price)}
                                                </span>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="p-4">
                                                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                                                    {service.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-3">Estimated 30–60 min</p>
                                                <button
                                                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] ${
                                                        hasActiveBooking
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                                                    }`}
                                                    disabled={hasActiveBooking}
                                                    onClick={() => handleBookNow(service)}
                                                >
                                                    {hasActiveBooking ? "Booking Active" : "Book Now"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-6 sm:mt-8 flex items-center justify-center gap-1 sm:gap-2">
                                        <button
                                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                            disabled={safePage === 1}
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        >
                                            <span className="hidden sm:inline">Previous</span>
                                            <span className="sm:hidden">←</span>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter((n) => {
                                                    // Show first, last, current, and neighbors
                                                    if (n === 1 || n === totalPages) return true;
                                                    if (Math.abs(n - safePage) <= 1) return true;
                                                    return false;
                                                })
                                                .map((n, idx, arr) => {
                                                    // Add ellipsis
                                                    const prev = arr[idx - 1];
                                                    const showEllipsis = prev && n - prev > 1;
                                                    return (
                                                        <React.Fragment key={n}>
                                                            {showEllipsis && (
                                                                <span className="px-2 text-gray-400">...</span>
                                                            )}
                                                            <button
                                                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border text-sm font-medium transition-colors ${
                                                                    n === safePage 
                                                                        ? "bg-blue-600 text-white border-blue-600" 
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
                                            disabled={safePage === totalPages}
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        >
                                            <span className="hidden sm:inline">Next</span>
                                            <span className="sm:hidden">→</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default BookingPage;


