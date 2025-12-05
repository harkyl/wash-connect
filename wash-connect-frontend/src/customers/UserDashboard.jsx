import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  Inbox,
  Star,
  Heart,
  Calendar,
  LogOut,
  Mail,
  Phone,
  Video,
  MessageCircle,
  MoreVertical,
  Menu,
  X,
} from "lucide-react"
import { FaEnvelope, FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa"

// Helper: format birthday to YYYY-MM-DD, stripping time/UTC part
const formatBirthday = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  try {
    const d = new Date(s);
    if (!isNaN(d)) return d.toLocaleDateString();
  } catch { /* empty */ }
  return s.split("T")[0];
};

// NEW: format date-only for bookings (removes T... part)
const formatDateOnly = (raw) => {
  if (!raw) return "";
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return s.includes("T") ? s.split("T")[0] : s;
};

const ACTIVE_STATUSES = ["Pending","Confirmed","On Going","Halfway"];
const isActiveStatus = (s) => ACTIVE_STATUSES.includes(String(s || "").trim());

function UserDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    birthday: "",
    gender: "",
  })
  const [profilePic, setProfilePic] = useState(null)
  const [bookings, setBookings] = useState([])
  const [cancelling, setCancelling] = useState({}) // bookingId:boolean

  // NEW: edit state for Personal Information
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    birthday: "",
    gender: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")
    if (!token || !user) {
      navigate("/login")
      return
    }
    try {
      const parsedUser = JSON.parse(user)
      setUserInfo({
        firstName: parsedUser.first_name || "",
        lastName: parsedUser.last_name || "",
        email: parsedUser.email || "",
        contactNumber: parsedUser.phone || "",
        address: parsedUser.address || "",
        birthday: formatBirthday(parsedUser.birth_date || parsedUser.birthday || ""),
        gender: parsedUser.gender || "",
      })
    } catch {
      navigate("/login")
    }
  }, [navigate])

  // Fetch user's active booking and all bookings
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
        .then((res) => res.json())
        .then((bookingsData) => {
          // Show all except Declined/Cancelled, but include Refunded
          setBookings(
            (bookingsData || []).filter(
              (b) =>
                b.status !== "Declined" &&
                (b.status !== "Cancelled" || b.payment_status === "Refunded")
            )
          );
        })
        .catch(() => {
          setBookings([]);
        });
    } else {
      setBookings([]);
    }
  }, [])

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  // Handle profile picture upload
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user.user_id;
      if (!userId) return;

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`http://localhost:3000/api/users/${userId}/avatar`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        console.error("Avatar upload failed");
        return;
      }
      const data = await res.json();
      const avatarUrl = data.avatar?.startsWith('http') ? data.avatar : `http://localhost:3000${data.avatar}`;
      setProfilePic(avatarUrl);

      const updated = { ...user, avatar: data.avatar };
      localStorage.setItem("user", JSON.stringify(updated));
    } catch (err) {
      console.error("Error uploading avatar:", err);
    }
  }

  // NEW: start editing populated from raw user in localStorage
  const startEditing = () => {
    const raw = JSON.parse(localStorage.getItem("user") || "{}");
    setEditForm({
      firstName: raw.first_name ?? userInfo.firstName,
      lastName: raw.last_name ?? userInfo.lastName,
      email: raw.email ?? userInfo.email,
      contactNumber: raw.phone ?? userInfo.contactNumber,
      address: raw.address ?? userInfo.address,
      birthday: formatDateOnly(raw.birth_date || raw.birthday || userInfo.birthday || ""),
      gender: raw.gender ?? userInfo.gender,
    });
    setSaveMsg({ type: "", text: "" });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveMsg({ type: "", text: "" });
  };

  const handleSaveProfile = async () => {
    setSaveMsg({ type: "", text: "" });

    // simple validation
    if (!editForm.firstName?.trim() || !editForm.lastName?.trim()) {
      setSaveMsg({ type: "error", text: "First and last name are required." });
      return;
    }
    if (!editForm.email?.includes("@")) {
      setSaveMsg({ type: "error", text: "Enter a valid email." });
      return;
    }

    try {
      setSaving(true);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = stored.id || stored.user_id;
      const token = localStorage.getItem("token");
      if (!userId || !token) {
        setSaveMsg({ type: "error", text: "Not authorized. Please login again." });
        return;
      }

      const payload = {
        first_name: editForm.firstName?.trim(),
        last_name: editForm.lastName?.trim(),
        email: editForm.email?.trim(),
        phone: editForm.contactNumber?.trim(),
        address: editForm.address?.trim(),
        birth_date: editForm.birthday || null,
        gender: editForm.gender || "",
      };

      // Try PUT, then PATCH as fallback
      const tryRequests = [
        { method: "PUT", url: `http://localhost:3000/api/users/${userId}` },
        { method: "PATCH", url: `http://localhost:3000/api/users/${userId}` },
      ];

      let updatedUser = null;
      for (const req of tryRequests) {
        const res = await fetch(req.url, {
          method: req.method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          try {
            updatedUser = await res.json();
          } catch {
            updatedUser = null;
          }
          break;
        }
      }

      // Merge and persist
      const merged = {
        ...stored,
        ...(updatedUser || {}),
        first_name: (updatedUser?.first_name ?? payload.first_name),
        last_name: (updatedUser?.last_name ?? payload.last_name),
        email: (updatedUser?.email ?? payload.email),
        phone: (updatedUser?.phone ?? payload.phone),
        address: (updatedUser?.address ?? payload.address),
        birth_date: (updatedUser?.birth_date ?? payload.birth_date),
        gender: (updatedUser?.gender ?? payload.gender),
      };
      localStorage.setItem("user", JSON.stringify(merged));

      // Reflect to UI state
      setUserInfo({
        firstName: merged.first_name || "",
        lastName: merged.last_name || "",
        email: merged.email || "",
        contactNumber: merged.phone || "",
        address: merged.address || "",
        birthday: formatBirthday(merged.birth_date || ""),
        gender: merged.gender || "",
      });

      setSaveMsg({ type: "success", text: "Profile updated." });
      setIsEditing(false);
    } catch {
      setSaveMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (appointmentId) => {
    if (!appointmentId || cancelling[appointmentId]) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    // Find original status
    setCancelling((m) => ({ ...m, [appointmentId]: true }));
    setBookings((prev) =>
      prev.map((b) =>
        b.appointment_id === appointmentId
          ? { ...b, originalStatus: b.status, status: "Cancelled" }
          : b
      )
    );

    try {
      const res = await fetch(`http://localhost:3000/api/bookings/cancel/${appointmentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        // Revert status on failure
        setBookings((prev) =>
          prev.map((b) =>
            b.appointment_id === appointmentId
              ? { ...b, status: b.originalStatus || "Pending" }
              : b
          )
        );
      }
    } catch {
      setBookings((prev) =>
        prev.map((b) =>
          b.appointment_id === appointmentId
            ? { ...b, status: b.originalStatus || "Pending" }
            : b
        )
      );
    } finally {
      setCancelling((m) => ({ ...m, [appointmentId]: false }));
      // Optional: remove cancelled booking from list
      // setBookings((prev) => prev.filter(b => b.appointment_id !== appointmentId));
    }
  };

  // Close sidebar when clicking outside on mobile
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-cyan-50 to-blue-100">
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
        w-72 bg-white border-r border-gray-200 flex flex-col min-h-screen shadow-lg
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
          <div className="flex items-center w-full px-4 py-3 rounded-lg bg-cyan-100 text-cyan-700 font-semibold cursor-pointer">
            <FaUser className="mr-3 w-5 h-5" />
            Account
          </div>
          <div 
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => { closeSidebar(); navigate("/popular-carwash"); }}
          >
            <FaStar className="mr-3 w-5 h-5" />
            Carwash Shops
          </div>
          <div 
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer" 
            onClick={() => { closeSidebar(); navigate("/book"); }}
          >
            <FaHeart className="mr-3 w-5 h-5" />
            Services
          </div>
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => { closeSidebar(); navigate("/track-status"); }}
          >
            <span className="mr-3 text-lg">🔎</span>
            Track Status
          </div>
          <div
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
            onClick={() => {
              closeSidebar();
              const activeBooking = bookings.find(b => isActiveStatus(b.status));
              if (activeBooking) {
                navigate("/booking-confirmation", { state: { appointment_id: activeBooking.appointment_id } });
              } else {
                navigate("/booking-confirmation");
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
            <span>LogOut</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-[#7cc3e2] to-[#a8d6ea] border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-white">My Account</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-cyan-200">
              <FaUser className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                {userInfo.firstName} {userInfo.lastName}
              </span>
            </div>
            <HeaderMenuDropdown navigate={navigate} />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Mobile Profile Summary */}
            <div className="lg:hidden mb-6">
              <div className="bg-gradient-to-br from-cyan-100 to-blue-50 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        profilePic ||
                        (() => {
                          const u = JSON.parse(localStorage.getItem("user") || "{}");
                          if (u?.avatar) {
                            return u.avatar.startsWith('http') ? u.avatar : `http://localhost:3000${u.avatar}`;
                          }
                          return "/placeholder.svg";
                        })()
                      }
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border-3 border-cyan-300 shadow"
                    />
                    <label className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 cursor-pointer hover:bg-blue-600 border-2 border-white shadow">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePicChange}
                      />
                      <User className="w-3 h-3 text-white" />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {userInfo.firstName} {userInfo.lastName}
                    </h2>
                    <span className="text-cyan-600 font-medium text-sm">Customer</span>
                    <p className="text-xs text-gray-600 truncate mt-1">{userInfo.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Profile Card - Desktop */}
              <div className="hidden lg:block col-span-1">
                <div className="bg-gradient-to-br from-cyan-100 to-blue-50 rounded-2xl p-8 shadow-xl flex flex-col items-center relative sticky top-24">
                  <div className="relative mb-4 flex flex-col items-center">
                    <img
                      src={
                        profilePic ||
                        (() => {
                          const u = JSON.parse(localStorage.getItem("user") || "{}");
                          if (u?.avatar) {
                            return u.avatar.startsWith('http') ? u.avatar : `http://localhost:3000${u.avatar}`;
                          }
                          return "/placeholder.svg";
                        })()
                      }
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border-4 border-cyan-300 shadow-lg"
                    />
                    <label className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2 cursor-pointer hover:bg-blue-600 border-2 border-white shadow-lg">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePicChange}
                      />
                      <User className="w-5 h-5 text-white" />
                    </label>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-wide text-center">
                    {userInfo.firstName} {userInfo.lastName}
                  </h2>
                  <span className="text-cyan-600 font-semibold mb-2">Customer</span>
                  <div className="flex space-x-3 mb-4">
                    <button className="p-2 bg-white rounded-full shadow hover:bg-cyan-100 transition">
                      <Mail className="w-5 h-5 text-cyan-500" />
                    </button>
                    <button className="p-2 bg-white rounded-full shadow hover:bg-cyan-100 transition">
                      <Phone className="w-5 h-5 text-cyan-500" />
                    </button>
                    <button className="p-2 bg-white rounded-full shadow hover:bg-cyan-100 transition">
                      <MessageCircle className="w-5 h-5 text-cyan-500" />
                    </button>
                  </div>
                  <div className="w-full mt-4">
                    <div className="border-b pb-4 mb-4">
                      <div className="flex items-center mb-2">
                        <Mail className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" />
                        <span className="font-medium text-gray-800 text-sm truncate">{userInfo.email}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Phone className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" />
                        <span className="font-medium text-gray-800 text-sm">{userInfo.contactNumber}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Inbox className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" />
                        <span className="font-medium text-gray-800 text-sm truncate">{userInfo.address}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Birthday</span>
                        <span className="block font-medium text-gray-800 text-sm">{userInfo.birthday}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 mb-1">Gender</span>
                        <span className="block font-medium text-gray-800 text-sm">{userInfo.gender}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings Section */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg sm:text-xl font-semibold">My Bookings</span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm">{bookings.length}</span>
                      </div>
                    </div>
                    <button
                      className="bg-cyan-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors font-semibold shadow text-sm sm:text-base"
                      onClick={() => navigate("/popular-carwash")}
                    >
                      Book Now
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[400px] sm:max-h-96 overflow-y-auto">
                    {bookings.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">
                        <FaCalendarAlt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No bookings yet.</p>
                        <button
                          className="mt-4 text-cyan-600 font-medium hover:underline"
                          onClick={() => navigate("/popular-carwash")}
                        >
                          Browse carwash shops →
                        </button>
                      </div>
                    ) : (
                      bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border border-gray-100 rounded-xl p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 shadow hover:shadow-lg transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-lg bg-cyan-100 border border-cyan-200 flex-shrink-0">
                              <FaStar className="text-cyan-500 text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                  {booking.title || booking.service_name}
                                </h4>
                                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold shadow whitespace-nowrap ${
                                  booking.status === "Refunded" || booking.payment_status === "Refunded"
                                    ? "bg-pink-100 text-pink-700"
                                    : booking.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : booking.status === "Approved" || booking.status === "Confirmed"
                                    ? "bg-green-100 text-green-700"
                                    : booking.status === "Cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {(booking.status === "Refunded" || booking.payment_status === "Refunded") ? (
                                    <>
                                      Refunded <span className="ml-1" title="Refunded">💸</span>
                                    </>
                                  ) : (
                                    booking.status
                                  )}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2 truncate">
                                {booking.description || booking.address}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="font-semibold text-cyan-700 text-base">
                                  {booking.price ? `₱${booking.price}` : ""}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDateOnly(booking.date || booking.schedule_date)}
                                </span>
                              </div>
                              {(() => {
                                // Check if cancel should be disabled based on status
                                const isCancelDisabled = 
                                  booking.status === "On Going" || 
                                  booking.status === "Halfway" || 
                                  booking.status === "Completed" ||
                                  booking.status === "Cancelled" ||
                                  booking.status === "Declined";

                                if (isCancelDisabled) return null;

                                return (
                                  <div className="mt-4 flex justify-end">
                                    <button
                                      className="text-xs px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                                      disabled={cancelling[booking.appointment_id]}
                                      onClick={() => cancelBooking(booking.appointment_id)}
                                    >
                                      {cancelling[booking.appointment_id] ? "Cancelling..." : "Cancel Booking"}
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          {/* Optionally, show a note for refunded bookings */}
                          {(booking.status === "Refunded" || booking.payment_status === "Refunded") && (
                            <div className="mt-2 text-xs text-pink-600 font-medium">
                              Refunded. Please check your email for details.
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* User Details Section */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border-b pb-4">
                    <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                    {!isEditing ? (
                      <button
                        className="self-start sm:self-auto px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 text-sm font-semibold transition-colors"
                        onClick={startEditing}
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-semibold transition-colors"
                          onClick={cancelEditing}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 text-sm font-semibold disabled:opacity-60 transition-colors"
                          onClick={handleSaveProfile}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>

                  {saveMsg.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                      saveMsg.type === "success" 
                        ? "bg-green-50 text-green-600 border border-green-200" 
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      {saveMsg.text}
                    </div>
                  )}

                  {!isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <FaUser className="mr-2 text-cyan-400" /> First Name
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium">
                          {userInfo.firstName}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <FaUser className="mr-2 text-cyan-400" /> Last Name
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium">
                          {userInfo.lastName}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <FaEnvelope className="mr-2 text-cyan-400" /> Email Address
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium truncate">
                          {userInfo.email}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <Phone className="mr-2 text-cyan-400" /> Contact Number
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium">
                          {userInfo.contactNumber}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <Inbox className="mr-2 text-cyan-400" /> Address
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium">
                          {userInfo.address}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <Calendar className="mr-2 text-cyan-400" /> Birthday
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium">
                          {userInfo.birthday}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <User className="mr-2 text-cyan-400" /> Gender
                        </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 font-medium">
                          {userInfo.gender}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <FaUser className="mr-2 text-cyan-400" /> First Name
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <FaUser className="mr-2 text-cyan-400" /> Last Name
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <FaEnvelope className="mr-2 text-cyan-400" /> Email Address
                        </label>
                        <input
                          type="email"
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <Phone className="mr-2 text-cyan-400" /> Contact Number
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                          value={editForm.contactNumber}
                          onChange={(e) => setEditForm((f) => ({ ...f, contactNumber: e.target.value }))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <Inbox className="mr-2 text-cyan-400" /> Address
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                          value={editForm.address}
                          onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <Calendar className="mr-2 text-cyan-400" /> Birthday
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                          value={editForm.birthday || ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, birthday: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-sm text-gray-600 mb-2">
                          <User className="mr-2 text-cyan-400" /> Gender
                        </label>
                        <select
                          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                          value={editForm.gender || ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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

export default UserDashboard