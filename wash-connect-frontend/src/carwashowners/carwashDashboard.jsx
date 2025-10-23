import React, { useEffect, useState } from "react";
import { FaEnvelope, FaPhone, FaUserCircle, FaStar, FaRegStar, FaEye, FaBars, FaRegEnvelope, FaRegUser, FaRegCheckSquare, FaRegFolderOpen, FaTrophy, FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function CarwashDashboard() {
    const [recentBookings, setRecentBookings] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [ownerData, setOwnerData] = useState(null);
    const [carwashData, setCarwashData] = useState(null);
    const [services, setServices] = useState([]); // NEW
    const [isLoading, setIsLoading] = useState(true);
    const [profileUploaded, setProfileUploaded] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [showAddSvc, setShowAddSvc] = useState(false);
    const [svcForm, setSvcForm] = useState({ name: "", price: "", description: "" });
    const [svcFile, setSvcFile] = useState(null);
    const [reviews, setReviews] = useState([]); // <-- Use state for reviews
    const [editSvc, setEditSvc] = useState(null); // Add this state for editing
    const navigate = useNavigate();
    // NEW: selected booking for details modal
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [customerContact, setCustomerContact] = useState(""); // NEW

  useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/carwash-login");
                return;
            }
            try {
                const owner = JSON.parse(localStorage.getItem("carwashOwner"));
                if (!owner || !owner.id) return;

                // Fetch owner credentials
                const ownerRes = await fetch(`http://localhost:3000/api/carwash-owners/${owner.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (ownerRes.status === 401) {
                    navigate("/carwash-login");
                    return;
                }
                const ownerDataRaw = await ownerRes.json();
                const ownerData = {
                    ...ownerDataRaw,
                    first_name: ownerDataRaw.first_name || ownerDataRaw.owner_first_name || "",
                    last_name: ownerDataRaw.last_name || ownerDataRaw.owner_last_name || "",
                };
                setOwnerData(ownerData);

                // Fetch carwash application data
                const appRes = await fetch(`http://localhost:3000/api/carwash-applications/by-owner/${owner.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (appRes.status === 401) {
                    navigate("/carwash-login");
                    return;
                }
                const appData = await appRes.json();
                setCarwashData(appData);

                // Fetch bookings if application exists
                if (appData && appData.applicationId) {
                    const bookingsRes = await fetch(`http://localhost:3000/api/bookings/by-application/${appData.applicationId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (bookingsRes.status === 401) {
                        navigate("/carwash-login");
                        return;
                    }
                    const bookingsData = await bookingsRes.json();
                    setRecentBookings(bookingsData);

                    // Fetch services
                    const svcRes = await fetch(`http://localhost:3000/api/services/by-application/${appData.applicationId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const svcData = await svcRes.json();
                    setServices(Array.isArray(svcData) ? svcData : []);

                    // Fetch reviews for this carwash application
                    const reviewsRes = await fetch(`http://localhost:3000/api/reviews/by-application/${appData.applicationId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const reviewsData = await reviewsRes.json();
                    setReviews(Array.isArray(reviewsData) ? reviewsData : []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };

    fetchData();
  }, [navigate]);

	// Optionally, hide the indicator after 2 seconds
	useEffect(() => {
		if (profileUploaded) {
			const timer = setTimeout(() => setProfileUploaded(false), 2000);
			return () => clearTimeout(timer);
		}
	}, [profileUploaded]);

	const showToast = (message, type = "success") => {
		setToast({ show: true, message, type });
		setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
	};

	const submitService = async (e) => {
		e.preventDefault();
		if (!carwashData?.applicationId) {
			showToast("Missing applicationId", "error");
			return;
		}
		const name = svcForm.name.trim();
		const price = Number(String(svcForm.price).replace(/[, ]/g, "")) || 0;
		if (!name) {
			showToast("Service name is required", "error");
			return;
		}
		try {
			const res = await fetch("http://localhost:3000/api/services", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					applicationId: carwashData.applicationId,
					name, price,
					description: svcForm.description || null,
				}),
			});
			if (!res.ok) {
				const msg = await res.text();
				showToast(`Failed to add service: ${msg || "server error"}`, "error");
				return;
			}
			const { serviceId } = await res.json();

			let image_url = null;
			if (svcFile) {
				const fd = new FormData();
				fd.append("image", svcFile);
				const imgRes = await fetch(`http://localhost:3000/api/services/${serviceId}/image`, {
					method: "POST",
					body: fd,
				});
				if (imgRes.ok) {
					const imgData = await imgRes.json();
					image_url = imgData.image_url || null;
				}
			}

			setServices(prev => [...prev, {
				serviceId,
				applicationId: carwashData.applicationId,
				name, price,
				description: svcForm.description || null,
				image_url,
				is_active: 1,
			}]);
			setSvcForm({ name: "", price: "", description: "" });
			setSvcFile(null);
			setShowAddSvc(false);
			showToast("Service added", "success");
		} catch {
			showToast("Network error", "error");
		}
	};

	if (isLoading) {
		return <div className="flex justify-center items-center h-screen">Loading...</div>;
	}

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar */}
			<aside className="w-64 bg-white border-r flex flex-col">
				{/* Logo */}
				<div className="px-6 py-8">
					<div className="text-3xl flex items-center select-none">
						<span
							className="text-gray-700"
							style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}
						>
							Wash
						</span>
						<span
							className="ml-2 text-red-500 font-semibold"
							style={{ fontFamily: '"Great Vibes", cursive', fontSize: "2.2rem" }}
						>
							Connect
						</span>
					</div>
				</div>
				{/* Navigation */}
				<nav className="flex-1 px-4 space-y-2">
				  <button
					className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 ${
					  activeTab === "overview"
						? "bg-blue-100 text-blue-700 font-semibold" 
						: "hover:bg-gray-100 cursor-pointer"
					}`}
					onClick={() => setActiveTab("overview")}
				  >
					<FaRegEye /> Overview
				  </button>
				  <button
					className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 ${
					  activeTab === "customers" 
						? "bg-blue-100 text-blue-700 font-semibold" 
						: "hover:bg-gray-100 cursor-pointer"
					}`}
					onClick={() => {
						setActiveTab("customers");
						navigate("/customer-list");
					}}>
					<span className="text-lg">★</span> Customers & Employee
				  </button>
				  <hr className="my-2 border-gray-300" />
				  <button
					className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
					onClick={() => navigate("/bookings")}
				  >
					<FaRegCheckSquare className="text-lg" />
					<span>Manage Bookings</span>
				  </button>
				  <div className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200">
					<FaRegCheckSquare className="text-lg" />
					<span>Booking History</span>
				  </div>
				  <div className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200" onClick={() => navigate('/earning-dashboard')}>
					<FaTrophy className="text-lg" />
					<span>Earnings Dashboard</span>
				  </div>
				  <div
					className="flex items-center gap-2 mt-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200"
					onClick={() => navigate('/refund-request')}
				  >
					<FaRegFolderOpen className="text-lg" />
					<span>Request Refund</span>
				  </div>
				  <hr className="my-4 border-gray-300" />
				</nav>
			  <div className="mt-auto px-4 py-6">
				<button className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
					onClick={() => navigate("/carwash-login")}
				>
				  <FaRegFolderOpen className="text-lg" /> Logout
				</button>
			  </div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 flex flex-col"> 
				{/* Header */}
				<header className="flex items-center justify-between px-8 py-4 bg-blue-100 border-b">
					<div className="flex items-center gap-4">
						<h1 className="text-2xl font-semibold">Overview</h1>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-gray-500">Owner</span>
						<FaUserCircle className="text-2xl text-gray-400" />
					</div>
				</header>

				{/* Main Grid */}
				<div className="flex-1 grid grid-cols-3 gap-6 p-8">
					{/* Profile & Services */}
					<section className="col-span-2">
						<div className="flex items-center gap-6">
							<div className="relative">
								<img
									src={
										ownerData?.owner_avatar
											? ownerData.owner_avatar.startsWith('http')
												? ownerData.owner_avatar
												: `http://localhost:3000${ownerData.owner_avatar}`
											: "https://ui-avatars.com/api/?name=" +
												encodeURIComponent(
													`${ownerData?.first_name || ""} ${ownerData?.last_name || ""}`
												)
									}
									alt="Profile"
									className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
								/>
								{/* Upload Icon */}
								<label className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow cursor-pointer">
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={async (e) => {
											const file = e.target.files[0];
											if (!file) return;
			
											try {
												const formData = new FormData();
												formData.append("file", file); // Try both "avatar" and "file" as field names

												const owner = JSON.parse(localStorage.getItem("carwashOwner"));
												const res = await fetch(
													`http://localhost:3000/api/carwash-owners/${owner.id}/avatar`,
													{
														method: "POST",
														body: formData,
														// Don't set Content-Type header manually
													}
												);
												
												if (!res.ok) {
													const errorData = await res.json();
													console.error("Upload failed:", errorData);
													return;
												}
												
												const updated = await res.json();
												setOwnerData((prev) => ({
													...prev,
													avatar: updated.avatar.startsWith('http')
														? updated.avatar
														: `http://localhost:3000${updated.avatar}`,
												}));
												setProfileUploaded(true);
											} catch (error) {
												console.error("Error uploading avatar:", error);
											}
										}}
									/>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 text-blue-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</label>
                                {/* Success indicator */}
                                {profileUploaded && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow flex items-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
							</div>
							<div>
								<h2 className="text-2xl font-bold">
									{ownerData
										? `${ownerData.first_name} ${ownerData.last_name}`
										: "Carwash Owner"}
								</h2>
								<p className="text-gray-500">Carwash owner</p>
							</div>
							<div className="ml-auto flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-lg shadow flex items-center justify-center mb-2">
              <img
                src={
                  carwashData?.logo
                    ? `http://localhost:3000/uploads/logos/${carwashData.logo}`
                    : "/default-logo.png"
                }
                alt="Company Logo"
                className="w-20 h-20 object-contain"
                onError={e => { e.target.onerror = null; e.target.src = "/default-logo.png"; }}
              />
            </div>
            <div className="text-center text-base mt-1 font-semibold">
              {carwashData?.carwash_name || carwashData?.carwashName || "Carwash Company"}
            </div>
            {/* Optionally, add stars or rating here */}
          </div>
						</div>

						{/* Services */}
						<div className="mt-8">
							<div className="flex items-center gap-2">
								<h3 className="text-lg font-semibold">Services</h3>
								<span className="text-blue-400 cursor-pointer" title="Services info">?</span>
								<button
									className="ml-auto px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
									onClick={() => setShowAddSvc(true)}
								>
									Add Services +
								</button>
							</div>
							<div className="space-y-3 mt-4">
                {services.length === 0 ? (
                  <div className="text-gray-500 text-sm">No services configured yet.</div>
                ) : (
                  services.map(s => {
                    const img = s.image_url
                      ? (String(s.image_url).startsWith('http') ? s.image_url : `http://localhost:3000${s.image_url}`)
                      : "https://via.placeholder.com/64?text=Svc";
                    return (
                      <div key={s.serviceId} className="flex items-center justify-between border rounded p-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/64?text=Svc"; }}
                          />
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-sm text-gray-600">₱{Number(s.price).toFixed(2)}</div>
                          </div>
                        </div>
                        <button
                          className="text-blue-600 text-sm"
                          onClick={() => setEditSvc(s)} // Open edit modal with selected service
                        >
                          Edit
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
						</div>

						{/* Recent Booking Request */}
						<div className="mt-10">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">Recent Booking Request</h3>
								<button className="px-3 py-1 bg-gray-100 rounded text-sm font-medium hover:bg-gray-200">
									View All
								</button>
							</div>
							<div className="space-y-4 max-h-[400px] overflow-y-auto">
                {recentBookings.length === 0 && (
                  <div className="text-gray-500 text-center">No recent bookings.</div>
                )}
                {recentBookings
                  .filter(b => b.status !== "Declined" && b.status !== "Cancelled")
                  .sort((a, b) => new Date(b.created_at || b.schedule_date) - new Date(a.created_at || a.schedule_date))
                  .slice(0, 5)
                  .map((booking) => {
                    const apptId = getAppointmentId(booking);
                    return (
                      <div
                        key={apptId}
                        className="flex flex-col md:flex-row items-start md:items-center bg-white border border-gray-200 rounded-xl shadow p-4 gap-4 relative"
                        style={{ borderColor: "#ffeeba", background: "#fffde7" }}
                      >
                        <img
                          src={booking.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.customer_name || "Customer")}`}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                        />
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base">{booking.customer_name}</span>
                            <span className="text-xs text-gray-500">Customer</span>
                            <span className="ml-auto flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                              <svg width="12" height="12" fill="currentColor"><circle cx="6" cy="6" r="6" /></svg>
                              {booking.status || "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {/* Show booking creation time if available, otherwise show schedule_date */}
                            <span>
                              {booking.created_at
                              ? new Date(booking.created_at).toLocaleDateString() +
                                " " +
                                new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(booking.schedule_date).toLocaleDateString() +
                                " " +
                                new Date(booking.schedule_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {/* Scheduled service time */}
                            <span>
                              Scheduled: {booking.schedule_date
                                ? new Date(booking.schedule_date).toLocaleDateString()
                                : "N/A"}
                              {/* Show schedule_time if available */}
                              {booking.schedule_time && (
                                <span className="ml-2">
                                  | Time: {booking.schedule_time}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm mt-1">
                            <span className="font-semibold">Address:</span>
                            <span className="truncate">{booking.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Services:</span>
                            <span className="truncate">{booking.service_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Vehicle:</span>
                            <span className="truncate">
                              {booking.vehicle_type || booking.vehicleType || "Motorcycle"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">Email:</span>
                            <span className="truncate">{booking.customer_email}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setCustomerContact(extractContact(booking) || ""); // NEW: prefill
                              }}
                            >
                              View Details
                            </button>
                            {/* Show Confirm/Decline ONLY if status is Pending */}
                            {booking.status === "Pending" && (
                              <>
                                <button
                                  className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-600 hover:text-white transition-colors duration-150"
                                  onClick={async () => {
                                    if (!apptId) {
                                      showToast("Missing appointment id.", "error");
                                      return;
                                    }
                                    try {
                                      // Optimistic UI
                                      setRecentBookings(prev =>
                                        prev.map(b => getAppointmentId(b) === apptId ? { ...b, status: "Confirmed" } : b)
                                      );

                                      const res = await fetch(`http://localhost:3000/api/bookings/confirm/${apptId}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" }
                                      });

                                      if (!res.ok) {
                                        // rollback if failed
                                        setRecentBookings(prev =>
                                          prev.map(b => getAppointmentId(b) === apptId ? { ...b, status: booking.status } : b)
                                        );
                                        const msg = await res.text();
                                        showToast(`Failed to confirm: ${msg || "server error"}`, "error");
                                        return;
                                      }

                                      showToast("Booking confirmed!", "success");

                                      // Refetch to be 100% consistent with DB
                                      const owner = JSON.parse(localStorage.getItem("carwashOwner"));
                                      if (owner?.id) {
                                        const appRes = await fetch(`http://localhost:3000/api/carwash-applications/by-owner/${owner.id}`);
                                        const appData = await appRes.json();
                                        if (appData?.applicationId) {
                                          const bookingsRes = await fetch(`http://localhost:3000/api/bookings/by-application/${appData.applicationId}`);
                                          const bookingsData = await bookingsRes.json();
                                          setRecentBookings(bookingsData);
                                        }
                                      }
                                    } catch {
                                      // rollback on error
                                      setRecentBookings(prev =>
                                        prev.map(b => getAppointmentId(b) === apptId ? { ...b, status: booking.status } : b)
                                      );
                                      showToast("Network error confirming booking.", "error");
                                    }
                                  }}
                                >
                                  Confirm
                                </button>
                                <button
                                  className="flex-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-600 hover:text-white transition-colors duration-150"
                                  onClick={async () => {
                                    if (!apptId) {
                                      showToast("Missing appointment id.", "error");
                                      return;
                                    }
                                    await fetch(`http://localhost:3000/api/bookings/decline/${apptId}`, { method: "PATCH" });
                                    setRecentBookings(prev => prev.filter(b => getAppointmentId(b) !== apptId));
                                    showToast("Booking declined", "success");
                                  }}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {/* If cancelled, just display a label */}
                            {booking.status === "Cancelled" && (
                              <span className="flex-1 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium text-center">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
							</div>
						</div>
					</section>

					{/* Lead Details & Reviews */}
					<aside className="col-span-1 flex flex-col gap-8">
            {/* Lead Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">Lead Details</h4>
                <button className="text-gray-400 hover:text-gray-700">
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="w-24 text-gray-500">Company</span>
                  <span className="font-medium">{carwashData?.carwash_name || carwashData?.carwashName || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-gray-500">Industry</span>
                  <span>{carwashData?.industry || "Service"}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-gray-500">Size</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                    {carwashData?.company_size || "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-gray-500">Email</span>
                  <span className="flex items-center gap-1">
                    <FaEnvelope className="text-gray-400" /> {ownerData?.owner_email || ownerData?.email || "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-gray-500">Phone</span>
                  <span className="flex items-center gap-1">
                    <FaPhone className="text-gray-400" /> {ownerData?.owner_phone || ownerData?.phone || "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-gray-500">Status</span>
                  <span className="text-green-600 font-medium">{carwashData?.status || "Contacted"}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-gray-500">Owner</span>
                  <span>{ownerData ? `${ownerData.first_name} ${ownerData.last_name}` : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Reviews */}
						<div className="bg-white rounded-lg shadow p-6">
							<h4 className="font-semibold text-lg mb-4">Reviews</h4>
							<div className="space-y-4 max-h-64 overflow-y-auto"> {/* <-- Make scrollable */}
                {reviews.length === 0 ? (
									<div className="text-gray-500 text-sm">No reviews yet.</div>
								) : (
                  reviews.map((r, i) => {
                    const avatarSrc = r.customer_avatar
                      ? (String(r.customer_avatar).startsWith('http')
                        ? r.customer_avatar
                        : `http://localhost:3000${r.customer_avatar}`)
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customer_name || 'Customer')}`;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <img
                          src={avatarSrc}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.customer_name || 'Customer')}`; }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm">{r.service_name || "Service"}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {r.comment}
                          </div>
                          <div className="text-xs text-gray-400">{r.customer_name}</div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, idx) =>
                            idx < (r.rating || 0) ? (
                              <FaStar key={idx} className="text-yellow-400 text-xs" />
                            ) : (
                              <FaRegStar key={idx} className="text-gray-300 text-xs" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
								)}
							</div>
						</div>
					</aside>
				</div>
			</main>

			{/* Toast Notification */}
			{toast.show && (
  <div className="fixed top-6 right-6 z-50">
    <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"} animate-slide-in`}>
      <span className="font-semibold">{toast.message}</span>
    </div>
  </div>
)}
<style>{`
  .animate-slide-in {
    animation: slide-in 0.4s cubic-bezier(.36,.07,.19,.97) both;
  }
  @keyframes slide-in {
    0% { opacity: 0; transform: translateY(-20px) scale(0.95);}
    100% { opacity: 1; transform: translateY(0) scale(1);}
  }
`}</style>

			{/* Add Service Modal */}
			{showAddSvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Add Service</h4>
              <button className="text-gray-500" onClick={() => setShowAddSvc(false)}>✕</button>
            </div>
            <form className="space-y-4" onSubmit={submitService}>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={svcForm.name}
                  onChange={(e) => setSvcForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Basic Carwash"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  value={svcForm.price}
                  onChange={(e) => setSvcForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="e.g., 200"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={svcForm.description}
                  onChange={(e) => setSvcForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border rounded px-3 py-2"
                  onChange={(e) => setSvcFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="px-3 py-1 rounded bg-gray-100" onClick={() => setShowAddSvc(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editSvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Edit Service</h4>
              <button className="text-gray-500" onClick={() => setEditSvc(null)}>✕</button>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const name = editSvc.name.trim();
                const price = Number(String(editSvc.price).replace(/[, ]/g, "")) || 0;
                if (!name) {
                  showToast("Service name is required", "error");
                  return;
                }
                try {
                  // Update service details
                  const res = await fetch(`http://localhost:3000/api/services/${editSvc.serviceId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name,
                      price,
                      description: editSvc.description || null,
                    }),
                  });
                  if (!res.ok) {
                    const msg = await res.text();
                    showToast(`Failed to update service: ${msg || "server error"}`, "error");
                    return;
                  }
                  // Optionally update image
                  if (editSvc.newImageFile) {
                    const fd = new FormData();
                    fd.append("image", editSvc.newImageFile);
                    await fetch(`http://localhost:3000/api/services/${editSvc.serviceId}/image`, {
                      method: "POST",
                      body: fd,
                    });
                  }
                  // Update local state
                  setServices((prev) =>
                    prev.map((svc) =>
                      svc.serviceId === editSvc.serviceId
                        ? { ...svc, name, price, description: editSvc.description, image_url: editSvc.image_url }
                        : svc
                    )
                  );
                  setEditSvc(null);
                  showToast("Service updated", "success");
                } catch {
                  showToast("Network error", "error");
                }
              }}
            >
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editSvc.name}
                  onChange={(e) => setEditSvc((svc) => ({ ...svc, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Price (₱)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  value={editSvc.price}
                  onChange={(e) => setEditSvc((svc) => ({ ...svc, price: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  value={editSvc.description || ""}
                  onChange={(e) => setEditSvc((svc) => ({ ...svc, description: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border rounded px-3 py-2"
                  onChange={(e) =>
                    setEditSvc((svc) => ({
                      ...svc,
                      newImageFile: e.target.files?.[0] || null,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="px-3 py-1 rounded bg-gray-100" onClick={() => setEditSvc(null)}>
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedBooking.avatar
                      ? selectedBooking.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.customer_name || "Customer")}`
                  }
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border"
                />
                <div>
                  <div className="font-semibold text-lg">
                    {selectedBooking.customer_name || `${selectedBooking.customer_first_name || ""} ${selectedBooking.customer_last_name || ""}`.trim() || "Customer"}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {getAppointmentId(selectedBooking) ?? "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                  {selectedBooking.status || "Pending"}
                </span>
                {selectedBooking.payment_status && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {selectedBooking.payment_status}
                  </span>
                )}
                <button
                  className="ml-2 text-gray-500 hover:text-gray-800"
                  onClick={() => setSelectedBooking(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Email</div>
                <div className="font-medium">{selectedBooking.customer_email || "N/A"}</div>
              </div>
              <div>
                <div className="text-gray-500">Contact</div>
                <div className="font-medium">{customerContact || "N/A"}</div> {/* CHANGED */}
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-500">Address</div>
                <div className="font-medium">{selectedBooking.address || "N/A"}</div>
              </div>
              <div>
                <div className="text-gray-500">Service</div>
                <div className="font-medium">{selectedBooking.service_name || "N/A"}</div>
              </div>
              <div>
                <div className="text-gray-500">Scheduled</div>
                <div className="font-medium">
                  {selectedBooking.schedule_date
                    ? new Date(selectedBooking.schedule_date).toLocaleDateString()
                    : "N/A"}
                  {selectedBooking.schedule_time && (
                    <span className="ml-2">| {selectedBooking.schedule_time}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Created</div>
                <div className="font-medium">
                  {selectedBooking.created_at
                    ? `${new Date(selectedBooking.created_at).toLocaleDateString()} ${new Date(selectedBooking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "N/A"}
                </div>
              </div>
              {selectedBooking.notes && (
                <div className="md:col-span-2">
                  <div className="text-gray-500">Notes</div>
                  <div className="font-medium whitespace-pre-wrap">{selectedBooking.notes}</div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
		</div>
	);
}


// Helper to get a booking's appointment id regardless of field name differences
const getAppointmentId = (b) => b?.appointment_id ?? b?.appointmentId ?? b?.id ?? null;

// NEW: extract any contact-like field from an object
const extractContact = (obj) =>
  obj?.customer_phone ??
  obj?.customer_contact ??
  obj?.contact ??
  obj?.phone ??
  obj?.user_phone ??
  obj?.mobile ??
  null;