import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

function CarwashLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ownerEmail: "",
    ownerPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/login-carwash-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      // Save token and owner info
      localStorage.setItem("token", data.token); 
      const ownerId = data.owner.id;

      // Fetch carwash application for this owner
      const appRes = await fetch(`http://localhost:3000/api/carwash-applications/by-owner/${ownerId}`);
      const appData = await appRes.json();
      const applicationId = appData.applicationId; // adjust based on your backend response

      // Save both owner id and applicationId in localStorage
      localStorage.setItem("carwashOwner", JSON.stringify({
        id: ownerId,
        applicationId: applicationId
      }));
      setLoading(false);

      // Check registration status
      const statusRes = await fetch(`http://localhost:3000/api/carwash-applications/status/${ownerId}`);
      const statusData = await statusRes.json();
      const status = (statusData.status || "").toLowerCase();

      // Check for banned status
      if (status === "banned") {
        navigate("/shop-banned", { replace: true });
        return;
      }

      if (status === "approved") {
        navigate("/carwash-dashboard");
      } else if (status === "pending") {
        navigate("/awaiting-approval");
      } else {
        navigate("/carwash-application-registration");
      }
    } catch  {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
        <button
          className="mb-6 p-2 hover:bg-black/10 rounded-full transition-colors"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <h1
          className="text-4xl mb-2 text-center"
          style={{ fontFamily: "Brush Script MT, cursive" }}
        >
          <span className="text-cyan-500">Wash</span>{" "}
          <span className="text-red-500">Connect</span>
        </h1>
        <h2 className="text-cyan-500 text-2xl font-medium italic mb-6 text-center">
          Carwash Owner Login
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="ownerEmail"
              value={form.ownerEmail}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Email"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="ownerPassword"
              value={form.ownerPassword}
              onChange={handleChange}
              className="w-full pl-12 pr-12 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* Forgotten password link */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              className="text-cyan-600 hover:underline text-sm font-medium"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>
          {error && (
            <div className="text-red-500 text-center font-medium">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xl py-3 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg mt-2"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-center mt-6">
          <span className="text-gray-700">Don't have an account?</span>{" "}
          <button
            className="text-cyan-600 hover:underline font-medium"
            onClick={() => navigate("/carwash-register")}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarwashLogin;