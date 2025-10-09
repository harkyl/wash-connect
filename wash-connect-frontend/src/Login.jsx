import { useState } from "react"
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Check } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show specific error toast for wrong credentials
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
  }

  return (
    <div className="min-h-screen w-screen flex">
      <Toaster position="top-center" />
      {/* Left side with form */}
      <div className="flex-1 bg-white flex flex-col p-8">
        <button
          className="self-start p-2 hover:bg-black/10 rounded-full transition-colors"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-10 w-full">
            <h1 className="text-5xl mb-8" style={{ fontFamily: "Brush Script MT, cursive" }}>
              <span className="text-cyan-500">Wash</span> <span className="text-gray-800">Connect</span>
            </h1>

            <h2 className="text-cyan-500 text-2xl font-medium italic mb-1">Login to your account</h2>
            <p className="text-gray-600 text-sm">Enter your login details</p>
          </div>

          {/* Tab selector */}
          <div className="flex w-full rounded-full overflow-hidden border border-gray-200 mb-6">
            <button
              className={`flex-1 py-3 px-6 ${activeTab === "login" ? "bg-black text-white" : "bg-white text-black"}`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 py-3 px-6 ${activeTab === "signup" ? "bg-black text-white" : "bg-white text-black"}`}
              onClick={() => navigate('/register')}
            >
              SignUp
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            {/* Identifier field */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Email or ID number"
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-3 bg-white text-black rounded-full border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              >
                {rememberMe && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className="text-gray-700">Remember me</span>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <span className="italic">Login</span>
            </button>

            {/* Social login removed */}
          </form>
        </div>
      </div>

      {/* Right side with car image */}
      <div className="flex-1 bg-gradient-to-br from-sky-200 to-sky-300 relative overflow-hidden flex items-center justify-center">
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