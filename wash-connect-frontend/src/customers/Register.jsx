import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Phone, MapPin, Eye, EyeOff } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
    gender: "",
    birthDate: "",
    agreeToTerms: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Email allowlist: only gmail.com or yahoo.com
    const emailOk = /^[\w.-]+@(gmail\.com|yahoo\.com)$/i.test(formData.email);
    if (!emailOk) {
      toast.error('Only Gmail and Yahoo email addresses are allowed.');
      return;
    }

        // Password policy: min 8, 1 upper, 1 lower, 1 digit, 1 special, no spaces
        const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/;
        if (!passwordPolicy.test(formData.password)) {
      toast.error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character, with no spaces.');
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.location,
          birth_date: formData.birthDate,
          gender: formData.gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Registration successful! You can now log in.");
      setTimeout(() => navigate("/login"), 1200); // Redirect after brief success toast
    } catch (err) {
      toast.error(err.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />
      <div className="flex-1 bg-gradient-to-br from-sky-200 to-sky-300 relative overflow-hidden">
        <button 
            className="absolute top-6 left-6 p-2 hover:bg-black/10 rounded-full transition-colors z-10"
            onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end h-full">
          <img
            src="motorcycle.png"
            alt="Red motorcycle"
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "80%" }}
          />
        </div>
      </div>

      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2" style={{ fontFamily: "Brush Script MT, cursive" }}>
              <span className="text-cyan-500">Wash</span> <span className="text-gray-800">Connect</span>
            </h1>
            <p className="text-cyan-500 text-lg font-medium">Create a new account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
                placeholder="First Name"
              />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
                placeholder="Last Name"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-black text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
                placeholder="Email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-3 bg-black text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white z-10"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-12 pr-12 py-3 bg-black text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white z-10"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-black text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
                placeholder="Phone Number"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 bg-black text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
                placeholder="Location"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
              >
                <option value="" className="text-gray-400">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-black text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 border-0"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              Sign Up
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-cyan-500 hover:underline font-medium"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
