import React, { useEffect, useMemo, useState } from "react";
import { FaRegCheckSquare, FaTrophy, FaUserCircle, FaDownload, FaRegFolderOpen, FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function EarningDashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [carwash, setCarwash] = useState({ carwashName: "Carwash", logo: "" });
  const [payments, setPayments] = useState([]);
  const [apiSummary, setApiSummary] = useState({ total_amount: 0, total_paid: 0, total_refunded: 0 });
  const [services, setServices] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [activeTab, setActiveTab] = useState("earnings");
  const [ownerName, setOwnerName] = useState("Owner");
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Load owner -> application -> payments
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const owner = JSON.parse(localStorage.getItem("carwashOwner") || "{}");
        if (!owner?.id || !token) {
          navigate("/login");
          return;
        }

        const initialName = `${owner.owner_first_name || owner.first_name || ""} ${owner.owner_last_name || owner.last_name || ""}`.trim() || "Owner";
        setOwnerName(initialName);

        try {
          const ownerRes = await fetch(`http://localhost:3000/api/carwash-owners/${owner.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (ownerRes.status === 401) {
            navigate("/login");
            return;
          }
          if (ownerRes.ok) {
            const od = await ownerRes.json();
            const freshName = `${od.first_name || od.owner_first_name || ""} ${od.last_name || od.owner_last_name || ""}`.trim() || "Owner";
            setOwnerName(freshName);
          }
        } catch {
          // ignore
        }

        const appRes = await fetch(`http://localhost:3000/api/carwash-applications/by-owner/${owner.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (appRes.status === 401) {
          navigate("/login");
          return;
        }
        const appData = await appRes.json();

        const applicationId = appData?.applicationId;
        const logoUrl = appData?.logo
          ? `http://localhost:3000/uploads/logos/${appData.logo}`
          : "/default-logo.png";

        setCarwash({
          carwashName: appData?.carwashName || "Carwash",
          logo: logoUrl,
          applicationId,
        });

        if (!applicationId) {
          setPayments([]);
          setApiSummary({ total_amount: 0, total_paid: 0, total_refunded: 0 });
          setServices([]);
          return;
        }

        const payRes = await fetch(`http://localhost:3000/api/payments/by-application/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (payRes.status === 401) {
          navigate("/login");
          return;
        }
        const payData = await payRes.json();
        setPayments(Array.isArray(payData?.payments) ? payData.payments : []);
        setApiSummary(payData?.summary || { total_amount: 0, total_paid: 0, total_refunded: 0 });

        const svcRes = await fetch(`http://localhost:3000/api/services/by-application/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (svcRes.status === 401) {
          navigate("/login");
          return;
        }
        const svcData = await svcRes.json();
        setServices(Array.isArray(svcData) ? svcData : []);
      } catch {
        setPayments([]);
        setApiSummary({ total_amount: 0, total_paid: 0, total_refunded: 0 });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const owner = JSON.parse(localStorage.getItem("carwashOwner") || "{}");
    const applicationId = owner.applicationId;
    if (!applicationId || !token) return;
    fetch(`http://localhost:3000/api/refunds?ownerId=${applicationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          navigate("/login");
          return [];
        }
        return res.json();
      })
      .then((data) => setRefunds(Array.isArray(data) ? data : []))
      .catch(() => setRefunds([]));
  }, [navigate]);

  const fmtPHP = (n) =>
    `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const nowLabel = useMemo(() => {
    const d = new Date();
    return `${d.toLocaleString("en-US", { month: "long" })}, ${d.getFullYear()}`;
  }, []);

  const { summary, trend, details } = useMemo(() => {
    const toDate = (s) => {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    };
    const isRefund = (s) => String(s || "").toLowerCase() === "refunded";
    const isCompleted = (s) => {
      const v = String(s || "").toLowerCase();
      return v.includes("complete") || v.includes("finished") || v === "done";
    };

    const detailsRows = payments.map((p) => ({
      date: toDate(p.created_at)?.toISOString().slice(0, 10) || "",
      type: isRefund(p.payment_status) ? "Refund" : "Income",
      description: p.service_name || "Payment",
      amount: Number(p.amount || 0),
      status: p.payment_status || "—",
    }));

    const totalServices = new Set(payments.map((p) => p.appointment_id)).size;
    const finished = payments.filter((p) => isCompleted(p.booking_status)).length;
    const efficiencyPct = totalServices ? Math.round((finished / totalServices) * 100) : 0;

    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth() });
    }
    const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;

    const grouped = new Map(months.map(({ y, m }) => [monthKey(y, m), { income: 0, refund: 0 }]));
    for (const p of payments) {
      const d = toDate(p.created_at);
      if (!d) continue;
      const key = monthKey(d.getFullYear(), d.getMonth());
      if (!grouped.has(key)) continue;
      const g = grouped.get(key);
      if (isRefund(p.payment_status)) g.refund += Number(p.amount || 0);
      else g.income += Number(p.amount || 0);
    }
    const trendRows = months.map(({ y, m }) => {
      const g = grouped.get(monthKey(y, m));
      const net = (g?.income || 0) - (g?.refund || 0);
      return {
        name: new Date(y, m, 1).toLocaleString("en-US", { month: "long" }),
        short: new Date(y, m, 1).toLocaleString("en-US", { month: "short" }),
        value: net,
      };
    });

    const best = trendRows.reduce((a, b) => (b.value > (a?.value ?? -Infinity) ? b : a), null) || { name: "—", value: 0 };
    const low = trendRows.reduce((a, b) => (b.value < (a?.value ?? Infinity) ? b : a), null) || { name: "—", value: 0 };

    const income = apiSummary.total_paid || 0;
    const refundsTotal = apiSummary.total_refunded || 0;
    const profit = apiSummary.total_amount || 0;

    const thisMonth = trendRows[trendRows.length - 1]?.value || 0;
    const prevMonth = trendRows[trendRows.length - 2]?.value || 0;
    const deltaPct = prevMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - prevMonth) / Math.abs(prevMonth)) * 100);

    return {
      summary: {
        carwashName: carwash.carwashName,
        month: nowLabel,
        finished,
        totalServices,
        efficiency: `${efficiencyPct}%`,
        logoUrl: carwash.logo,
        bestMonth: { name: best.name, profit: best.value },
        lowestMonth: { name: low.name, profit: low.value },
        income: income.toLocaleString(),
        incomeChange: `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`,
        expense: refundsTotal.toLocaleString(),
        profit: profit.toLocaleString(),
        profitChange: `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`,
        deltaPct,
      },
      trend: trendRows,
      details: detailsRows.sort((a, b) => (a.date < b.date ? 1 : -1)),
    };
  }, [payments, apiSummary, carwash.carwashName, carwash.logo, nowLabel]);

  const totalIncome = details.filter((d) => d.type === "Income").reduce((sum, d) => sum + d.amount, 0);

  const detailsWithRefunds = useMemo(() => {
    const toDateStr = (s) => {
      const d = new Date(s);
      return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
    };
    const refundRows = (Array.isArray(refunds) ? refunds : []).map((r) => ({
      date: toDateStr(r.requestedAt),
      type: "Refund",
      description: r.reason || "Refund",
      amount: Number(r.amount || 0),
      status: r.status || "—",
    }));
    return [...details, ...refundRows].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [details, refunds]);

  const trendLabels = trend.map((month) => month.short);
  const trendValues = trend.map((month) => month.value);
  const trendBarData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Net Income",
        data: trendValues,
        backgroundColor: trendValues.map((v) =>
          v > 0 ? "rgba(34, 197, 94, 0.8)" : v < 0 ? "rgba(239, 68, 68, 0.8)" : "rgba(251, 191, 36, 0.8)"
        ),
        borderRadius: 8,
        barThickness: 32,
      },
    ],
  };

  const finishedServicesCount = useMemo(() => {
    if (!services.length || !payments.length) return 0;
    return services.filter(svc =>
      payments.some(p =>
        (p.service_id === svc.service_id || p.service_id === svc.id) &&
        (
          String(p.booking_status).toLowerCase().includes("complete") ||
          String(p.booking_status).toLowerCase().includes("finished") ||
          String(p.booking_status).toLowerCase() === "done"
        )
      )
    ).length;
  }, [services, payments]);

  const totalRefundedAmount = refunds
    .filter(r => r.status === "Approved")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const doughnutData = {
    labels: ["Income", "Refunds"],
    datasets: [
      {
        data: [totalIncome, totalRefundedAmount],
        backgroundColor: ["rgba(34, 197, 94, 0.9)", "rgba(239, 68, 68, 0.9)"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("carwashOwner");
    navigate("/login");
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Type", "Description", "Amount", "Status"],
      ...detailsWithRefunds.map((r) => [r.date, r.type, r.description, r.amount, r.status]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings_${carwash.carwashName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  const displayedTransactions = showAllTransactions ? detailsWithRefunds : detailsWithRefunds.slice(0, 5);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r flex-col flex-shrink-0">
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
            className="w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => navigate("/carwash-dashboard")}
          >
            <FaRegEye /> Overview
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
            onClick={() => navigate("/customer-list")}
          >
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
          <button
            className="flex items-center gap-2 mb-1 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-200 w-full text-left"
            onClick={() => navigate("/booking-history")}
          >
            <FaRegCheckSquare className="text-lg" />
            <span>Booking History</span>
          </button>
          <div 
            className="flex items-center gap-2 mt-2 px-2 py-1 bg-blue-100 text-blue-700 font-semibold rounded cursor-pointer transition-colors duration-200"
          >
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
          <button 
            className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-200"
            onClick={handleLogout}
          >
            <FaRegFolderOpen className="text-lg" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-gray-700" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "1.5rem" }}>Wash</span>
                <span className="ml-1 text-red-500 font-semibold" style={{ fontFamily: '"Great Vibes", cursive', fontSize: "1.5rem" }}>Connect</span>
              </div>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <nav className="flex-1 p-3 space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left" onClick={() => { setSidebarOpen(false); navigate("/carwash-dashboard"); }}>
                <FaRegEye /> Overview
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left" onClick={() => { setSidebarOpen(false); navigate("/customer-list"); }}>
                <span className="text-lg">★</span> Customers & Employee
              </button>
              <hr className="my-2 border-gray-300" />
              <button className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-left" onClick={() => { setSidebarOpen(false); navigate("/bookings"); }}>
                <FaRegCheckSquare /> Manage Bookings
              </button>
              <button className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-left" onClick={() => { setSidebarOpen(false); navigate("/booking-history"); }}>
                <FaRegCheckSquare /> Booking History
              </button>
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 font-semibold rounded">
                <FaTrophy /> Earnings Dashboard
              </div>
              <button className="w-full flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded text-left" onClick={() => { setSidebarOpen(false); navigate("/refund-request"); }}>
                <FaRegFolderOpen /> Request Refund
              </button>
            </nav>
            <div className="p-3 border-t">
              <button className="flex items-center gap-2 text-gray-700 hover:text-red-500 px-2 py-1 rounded hover:bg-gray-100" onClick={handleLogout}>
                <FaRegFolderOpen /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Earnings Dashboard</h1>
              <p className="text-sm text-gray-500 hidden sm:block">{nowLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FaDownload className="text-xs" />
              Export
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
              <FaUserCircle className="text-xl text-gray-500" />
              <span className="hidden sm:inline text-sm font-medium text-gray-700">{ownerName}</span>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "earnings" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("earnings")}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "refunds" 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("refunds")}
            >
              Refunds
              {refunds.filter(r => r.status === "Pending").length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {refunds.filter(r => r.status === "Pending").length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "earnings" ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Income</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      summary.deltaPct >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {summary.incomeChange}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{fmtPHP(apiSummary.total_paid)}</p>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Refunds</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {refunds.length}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">{fmtPHP(totalRefundedAmount)}</p>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Profit</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      summary.deltaPct >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {summary.profitChange}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{fmtPHP(apiSummary.total_amount)}</p>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Efficiency</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {finishedServicesCount}/{services.length}
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{summary.efficiency}</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">Income Trend</h3>
                      <p className="text-sm text-gray-500">Last 6 months</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Profit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-600">Loss</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64 sm:h-72">
                    <Bar
                      data={trendBarData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: "#1f2937",
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: { label: (ctx) => `Net: ${fmtPHP(ctx.parsed.y)}` }
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { callback: (value) => fmtPHP(value), font: { size: 11 }, color: "#9ca3af" },
                            grid: { color: "#f3f4f6" },
                            border: { display: false }
                          },
                          x: {
                            ticks: { font: { size: 12 }, color: "#6b7280" },
                            grid: { display: false },
                            border: { display: false }
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">Distribution</h3>
                    <p className="text-sm text-gray-500">Income vs Refunds</p>
                  </div>
                  <div className="h-48 flex items-center justify-center">
                    <Doughnut
                      data={doughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        cutout: "65%",
                      }}
                    />
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-700">Income</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">{fmtPHP(totalIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-gray-700">Refunds</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{fmtPHP(totalRefundedAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📈</span>
                    <span className="text-sm font-medium opacity-90">Best Performing Month</span>
                  </div>
                  <p className="text-2xl font-bold">{summary.bestMonth?.name || "—"}</p>
                  <p className="text-lg font-semibold opacity-90">{fmtPHP(summary.bestMonth?.profit || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📉</span>
                    <span className="text-sm font-medium opacity-90">Lowest Performing Month</span>
                  </div>
                  <p className="text-2xl font-bold">{summary.lowestMonth?.name || "—"}</p>
                  <p className="text-lg font-semibold opacity-90">{fmtPHP(summary.lowestMonth?.profit || 0)}</p>
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Transaction History</h3>
                    <p className="text-sm text-gray-500">{detailsWithRefunds.length} total transactions</p>
                  </div>
                  <button
                    onClick={exportCSV}
                    className="sm:hidden flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    <FaDownload className="text-xs" />
                    Export CSV
                  </button>
                </div>
                
                {/* Mobile View */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {displayedTransactions.map((row, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          row.type === "Income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                          {row.type === "Income" ? "↑" : "↓"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{row.description}</p>
                          <p className="text-xs text-gray-500">{row.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${row.type === "Income" ? "text-green-600" : "text-red-600"}`}>
                          {row.type === "Income" ? "+" : "-"}{fmtPHP(row.amount)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          row.status === "Completed" || row.status === "Approved" ? "bg-green-100 text-green-700" :
                          row.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {detailsWithRefunds.length === 0 && (
                    <div className="p-10 text-center text-gray-400">
                      <span className="text-4xl block mb-2">📊</span>
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Amount</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayedTransactions.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 text-sm text-gray-600">{row.date}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              row.type === "Income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {row.type === "Income" ? "↑" : "↓"} {row.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-900 font-medium">{row.description}</td>
                          <td className={`px-5 py-4 text-sm font-semibold text-right ${
                            row.type === "Income" ? "text-green-600" : "text-red-600"
                          }`}>
                            {row.type === "Income" ? "+" : "-"}{fmtPHP(row.amount)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              row.status === "Completed" || row.status === "Approved" ? "bg-green-100 text-green-700" :
                              row.status === "Refunded" || row.status === "Rejected" ? "bg-red-100 text-red-700" :
                              row.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {detailsWithRefunds.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                            <span className="text-4xl block mb-2">📊</span>
                            No transactions yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {detailsWithRefunds.length > 5 && (
                  <div className="p-4 border-t text-center">
                    <button
                      onClick={() => setShowAllTransactions(!showAllTransactions)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {showAllTransactions ? "Show Less" : `View All ${detailsWithRefunds.length} Transactions`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Refunds Tab */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b">
                <h3 className="font-semibold text-gray-900">Refund Requests</h3>
                <p className="text-sm text-gray-500">{refunds.length} total requests</p>
              </div>
              
              {/* Mobile View */}
              <div className="sm:hidden divide-y divide-gray-100">
                {refunds.map((r) => (
                  <div key={r.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{r.customer}</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.status === "Approved" ? "bg-green-100 text-green-700" :
                        r.status === "Rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-red-600">{fmtPHP(r.amount)}</p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{r.reason}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                ))}
                {refunds.length === 0 && (
                  <div className="p-12 text-center text-gray-400">
                    <span className="text-4xl block mb-2">✨</span>
                    No refund requests
                  </div>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Amount</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {refunds.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">{r.customer}</td>
                        <td className="px-5 py-4 text-sm font-bold text-red-600 text-right">{fmtPHP(r.amount)}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">{r.reason}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            r.status === "Approved" ? "bg-green-100 text-green-700" :
                            r.status === "Rejected" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                    {refunds.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                          <span className="text-4xl block mb-2">✨</span>
                          No refund requests yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}