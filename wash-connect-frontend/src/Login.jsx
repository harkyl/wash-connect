import { useState } from "react"
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Check, User, Briefcase } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [rememberMe, setRememberMe] = useState(false)
  const [loginRole, setLoginRole] = useState("user"); // 'user' or 'carwash'
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUserAdminLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && (data.error.toLowerCase().includes("invalid") || data.error.toLowerCase().includes("wrong"))) {
          toast.error("Wrong username or password.");
        } else {
          toast.error(data.error || "Login failed");
        }
        return;
      }
      const user = data.user;
      if (user.status && user.status.toLowerCase() === 'banned') {
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/banned");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(user));

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier);
      if (isEmail) {
        navigate("/user-dashboard");
      } else {
        navigate("/admin-dashboard");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
      console.error(err);
    }
  };

  const handleCarwashOwnerLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/login-carwash-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carwash_owner_id: formData.identifier, ownerPassword: formData.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      
      localStorage.setItem("token", data.token);
      const ownerId = data.owner.id;

      const appRes = await fetch(`http://localhost:3000/api/carwash-applications/by-owner/${ownerId}`);
      const appData = await appRes.json();
      
      localStorage.setItem("carwashOwner", JSON.stringify({
        id: ownerId,
        applicationId: appData.applicationId 
      }));

      const statusRes = await fetch(`http://localhost:3000/api/carwash-applications/status/${ownerId}`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const statusData = await statusRes.json();
      const status = (statusData.status || "").toLowerCase();

      if (status === "banned") {
        navigate("/shop-banned", { replace: true });
      } else if (status === "declined") {
        toast.error("Your application has been declined. Please contact support.");
      } else if (status === "approved") {
        navigate("/carwash-dashboard");
      } else if (status === "pending") {
        navigate("/awaiting-approval");
      } else {
        navigate("/carwash-application-registration");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (loginRole === 'user') {
      await handleUserAdminLogin();
    } else {
      await handleCarwashOwnerLogin();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen w-screen md:flex">
      <Toaster position="top-center" />
      {/* Left side with form */}
      <div className="flex-1 bg-white flex flex-col p-4 sm:p-6 md:p-8">
        <button
          className="self-start p-2 hover:bg-black/10 rounded-full transition-colors"
          onClick={() => navigate('/')}
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto">
          <div className="text-center mb-8 sm:mb-10 w-full px-2">
            <h1 className="text-4xl sm:text-5xl mb-6 sm:mb-8" style={{ fontFamily: "Brush Script MT, cursive" }}>
              <span className="text-cyan-500">Wash</span> <span className="text-gray-800">Connect</span>
            </h1>

            <h2 className="text-cyan-500 text-xl sm:text-2xl font-medium italic mb-1">Login to your account</h2>
            <p className="text-gray-600 text-sm sm:text-base">Enter your login details</p>
          </div>

          {/* Role Selector */}
          <div className="flex w-full max-w-xs mx-auto rounded-full overflow-hidden border border-gray-200 mb-6">
            <button
              className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${loginRole === "user" ? "bg-black text-white" : "bg-white text-black"}`}
              onClick={() => setLoginRole("user")}
            >
              <User className="w-4 h-4" />
              <span>User</span>
            </button>
            <button
              className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${loginRole === "carwash" ? "bg-black text-white" : "bg-white text-black"}`}
              onClick={() => setLoginRole("carwash")}
            >
              <Briefcase className="w-4 h-4" />
              <span>Owner</span>
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex w-full rounded-full overflow-hidden border border-gray-200 mb-6">
            <button
              className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 ${activeTab === "login" ? "bg-black text-white" : "bg-white text-black"}`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 ${activeTab === "signup" ? "bg-black text-white" : "bg-white text-black"}`}
              onClick={() => navigate('/register')}
            >
              SignUp
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full px-1">
            {/* Identifier field */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder={loginRole === 'user' ? "Email or ID number" : "Carwash Owner ID"}
                inputMode="email"
                autoComplete="username"
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
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

            {/* Remember me */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-6 h-6 flex items-center justify-center rounded-full ${rememberMe ? "bg-black" : "border border-gray-300"}`}
                aria-pressed={rememberMe}
                aria-label="Remember me"
              >
                {rememberMe && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className="text-gray-700 text-sm sm:text-base">Remember me</span>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 sm:py-3.5 rounded-full font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 active:scale-[0.99] disabled:bg-gray-500"
            >
              <span className="italic">{loading ? "Logging in..." : "Login"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right side image: hidden on mobile */}
      <div className="flex-1 bg-gradient-to-br from-sky-200 to-sky-300 relative overflow-hidden items-center justify-center hidden md:flex">
        <img
          src="https://i.gifer.com/t6Y.gif"
          alt="Red Audi sports car"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

export default Login;