import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { FaUser, FaStar, FaHeart, FaCalendarAlt, FaSignOutAlt, FaSearch } from "react-icons/fa";
import { MoreVertical } from "lucide-react"; // Add at the top with other imports
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

	// Remove the toast for "No active appointment found" in handleTrackStatus
	const handleTrackStatus = async () => {
		// Directly navigate to track-status page, no toast or activeBooking check
		navigate("/track-status");
	};

	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div className="flex min-h-screen bg-gradient-to-br from-[#c8f1ff] to-[#e6f7ff]">
			<Toaster position="top-center" />
			{/* Sidebar */}
			<div className="w-72 bg-white/90 backdrop-blur border-r border-gray-200 flex flex-col min-h-screen">
				<div className="flex items-center px-8 py-8 border-b border-gray-100">
					<span className="text-3xl" style={{ fontFamily: "Brush Script MT, cursive" }}>
						<span className="text-cyan-500">Wash</span> <span className="text-red-500">Connect</span>
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
					<div
						className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700 cursor-pointer"
						onClick={() => navigate("/popular-carwash")}
					>
						<FaStar className="mr-3 w-5 h-5" />
						Carwash Shops
					</div>
					<div
						className={`flex items-center w-full px-4 py-3 rounded-lg font-semibold cursor-pointer ${
							location.pathname === "/book" ? "bg-cyan-100 text-cyan-700" : "hover:bg-gray-100 text-gray-700"
						}`}
						onClick={() => navigate("/book")}
					>
						<FaHeart className="mr-3 w-5 h-5" />
						Services
					</div>
					{/* Removed <hr className="my-4" /> */}
					{/* Track Status Tab */}
					<div
						className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-cyan-700 cursor-pointer"
						onClick={handleTrackStatus}
					>
						<span className="text-xl">🔎</span>
						<span className="text-gray-700">Track Status</span>
					</div>
					<div
						className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-gray-100 text-cyan-700 cursor-pointer"
						onClick={() => {
							if (activeBooking) {
								navigate("/booking-confirmation", { state: { appointment_id: activeBooking.appointment_id } });
							} else {
								toast("No active appointment found. Please book a service first!", { icon: "📅" });
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
							LogOut
						</div>
					</div>
				</nav>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<header className="flex items-center px-8 py-6 bg-gradient-to-r from-[#7cc3e2] to-[#a8d6ea] border-b border-gray-200">
					<span className="text-3xl font-semibold text-white">{carwashName}</span>
					<div className="ml-auto flex items-center gap-6 text-white relative">
									{/* Message label removed */}
						{/* Profile icon with name */}
						<div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-cyan-200">
							<User className="w-5 h-5 text-blue-400" />
							<span className="text-sm font-medium text-gray-700">
								{userName || "User"}
							</span>
						</div>
						{/* Three dots menu */}
						<div className="relative">
							<button
								className="p-2 rounded-full hover:bg-gray-200"
								onClick={() => setMenuOpen((v) => !v)}
								aria-label="Open menu"
							>
								<MoreVertical className="w-6 h-6 text-gray-700" />
							</button>
							{menuOpen && (
								<div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-20">
									<button
										className="w-full text-left px-4 py-2 hover:bg-cyan-50 text-cyan-700 font-medium"
										onClick={() => {
											setMenuOpen(false);
											navigate("/feedback");
										}}
									>
										Send Feedback
									</button>
								</div>
							)}
						</div>
					</div>
				</header>

				{/* Active appointment banner */}
				{hasActiveBooking && (
					<div className="px-8 py-3 bg-amber-50 text-amber-800 text-sm border-b border-amber-200">
						You have an active appointment. Complete or cancel it before booking another.
					</div>
				)}

				{/* Filters */}
				<div className="flex flex-col md:flex-row items-center gap-4 px-8 pt-6">
					<div className="relative w-full max-w-md">
						<FaSearch className="absolute left-3 top-3 text-gray-400" />
						<input
							type="text"
							placeholder="Search services"
							className="pl-9 pr-4 py-2 rounded-full border border-gray-300 bg-white w-full"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div className="ml-auto flex items-center gap-3">
						<label className="text-sm text-gray-600">Sort by</label>
						<select
							className="border border-gray-300 rounded-full px-3 py-2 bg-white text-sm"
							value={selectedSort}
							onChange={(e) => setSelectedSort(e.target.value)}
						>
										<option>New</option>
										<option>Price ascending</option>
										<option>Price descending</option>
										{/* Rating option removed */}
						</select>
					</div>
				</div>

				{/* Services Grid */}
				<div className="flex-1 p-8">
					<div className="flex items-end justify-between mb-4">
						<h2 className="text-lg font-semibold">{carwashName} Services</h2>
						{applicationId && !svcLoading && fetchedServices.length === 0 && (
							<div className="text-xs text-gray-500">No services found for this carwash.</div>
						)}
					</div>

					{svcLoading ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
							{Array.from({ length: 6 }).map((_, i) => (
								<div key={i} className="bg-white rounded-xl shadow border border-gray-200 p-4 animate-pulse">
									<div className="w-full h-40 bg-gray-200 rounded-lg mb-3" />
									<div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
									<div className="h-4 bg-gray-200 rounded w-1/3" />
								</div>
							))}
						</div>
					) : filteredServices.length === 0 ? (
						<div className="text-center text-gray-500 py-16">No services match your search.</div>
					) : (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
								{pagedServices.map((service) => (
									<div
										key={service.id}
										className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition border border-gray-200 overflow-hidden"
									>
										<div className="relative">
											<div className="w-full h-40 bg-white border-b border-gray-200 overflow-hidden">
												<img
													src={service.img}
													alt={service.name}
													className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
													onError={(e) => {
														e.currentTarget.onerror = null;
														e.currentTarget.src = "https://via.placeholder.com/400x300?text=Service";
													}}
												/>
											</div>
											<span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-1 rounded-full">
												{formatPHP(service.price)}
											</span>
										</div>
										<div className="p-4">
											<div className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
												{service.name}
											</div>
											<div className="text-xs text-gray-500 mb-3">Estimated 30–60 min</div>
											<button
												className={`w-full border px-3 py-2 rounded-lg text-sm font-semibold transition ${
													hasActiveBooking
														? "bg-gray-200 text-gray-500 cursor-not-allowed"
														: "bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-100"
												}`}
												disabled={hasActiveBooking}
												onClick={() => handleBookNow(service)}
											>
												Book Now
											</button>
										</div>
									</div>
								))}
							</div>

							{/* NEW: Pagination controls */}
							{totalPages > 1 && (
								<div className="mt-6 flex items-center justify-center gap-2">
									<button
										className="px-3 py-1 rounded border text-sm disabled:opacity-50"
										disabled={safePage === 1}
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									>
										Prev
									</button>

									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5)
										.map((n) => (
											<button
												key={n}
												className={`px-3 py-1 rounded border text-sm ${
													n === safePage ? "bg-blue-600 text-white border-blue-600" : "bg-white"
												}`}
												onClick={() => setCurrentPage(n)}
											>
												{n}
											</button>
										))}

									<button
										className="px-3 py-1 rounded border text-sm disabled:opacity-50"
										disabled={safePage === totalPages}
										onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									>
										Next
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export default BookingPage;


