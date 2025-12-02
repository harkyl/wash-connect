import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Phone, MapPin, User, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function CarwashRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ownerFirstName: "",
    ownerLastName: "",
    carwash_owner_id: "",
    ownerEmail: "",
    ownerPassword: "",
    ownerPhone: "",
    ownerAddress: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  // Notifications are shown via react-hot-toast

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // notifications are handled by toast
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // notifications handled by toast

    // Email allowlist: only gmail.com or yahoo.com
    const emailOk = /^[\w.-]+@(gmail\.com|yahoo\.com)$/i.test(form.ownerEmail);
    if (!emailOk) {
      toast.error('Only Gmail and Yahoo email addresses are allowed.');
      return;
    }

    // Password policy: min 8, 1 upper, 1 lower, 1 digit, 1 special, no spaces
    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;
    if (!passwordPolicy.test(form.ownerPassword)) {
      toast.error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character, with no spaces.');
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/auth/register-carwash-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Ensure payload matches backend expected keys
        body: JSON.stringify({
          ownerFirstName: form.ownerFirstName,
          ownerLastName: form.ownerLastName,
          carwash_owner_id: form.carwash_owner_id,
          ownerEmail: form.ownerEmail,
          ownerPassword: form.ownerPassword,
          ownerPhone: form.ownerPhone,
          ownerAddress: form.ownerAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      toast.success("Registration successful! You can now log in.");
      setTimeout(() => navigate("/carwash-login"), 1200);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100">
      <Toaster position="top-center" />
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
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
          Carwash Owner Registration
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="ownerFirstName"
                value={form.ownerFirstName}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="First Name"
                required
              />
            </div>
            <div className="flex-1 relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="ownerLastName"
                value={form.ownerLastName}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="carwash_owner_id"
              value={form.carwash_owner_id}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Carwash Owner ID"
              required
            />
          </div>
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
              placeholder="Password (min 8 characters)"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93A9.953 9.953 0 0122 9c0 5.523-4.477 10-10 10a9.953 9.953 0 01-4.07-.93M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.832-.642 1.627-1.1 2.367M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="ownerPhone"
              value={form.ownerPhone}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Phone (optional)"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="ownerAddress"
              value={form.ownerAddress}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Address (optional)"
            />
          </div>
          {/* Notifications handled by toast */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xl py-3 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg mt-2"
          >
            Register
          </button>
        </form>
        <div className="text-center mt-6">
          <span className="text-gray-700">Already have an account?</span>{" "}
          <button
            className="text-cyan-600 hover:underline font-medium"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarwashRegister;