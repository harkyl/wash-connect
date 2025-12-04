import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Phone, MapPin, User, ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real-time validation states
  const [checkingId, setCheckingId] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [idAvailable, setIdAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);

  // Use refs for debounce timers and abort controllers
  const idCheckTimeout = useRef(null);
  const emailCheckTimeout = useRef(null);
  const idAbortController = useRef(null);
  const emailAbortController = useRef(null);

  // Real-time check if Owner ID is available
  const checkIdAvailability = useCallback((id) => {
    // Clear any pending timeout
    if (idCheckTimeout.current) {
      clearTimeout(idCheckTimeout.current);
    }
    
    // Abort any pending request
    if (idAbortController.current) {
      idAbortController.current.abort();
    }

    // Reset states if empty or invalid format
    if (!id || id.length < 5) {
      setIdAvailable(null);
      setCheckingId(false);
      if (id && id.length > 0 && id.length < 5) {
        setErrors((prev) => ({
          ...prev,
          carwash_owner_id: `Owner ID must be 5 digits (${id.length}/5)`,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.carwash_owner_id;
          return newErrors;
        });
      }
      return;
    }

    if (!/^\d{5}$/.test(id)) {
      setIdAvailable(null);
      setCheckingId(false);
      setErrors((prev) => ({
        ...prev,
        carwash_owner_id: "Owner ID must be exactly 5 digits (numbers only)",
      }));
      return;
    }

    // Show checking state immediately
    setCheckingId(true);
    setIdAvailable(null);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.carwash_owner_id;
      return newErrors;
    });

    // Debounce the actual API call (300ms for faster response)
    idCheckTimeout.current = setTimeout(async () => {
      idAbortController.current = new AbortController();
      
      try {
        const res = await fetch(`http://localhost:3000/api/auth/check-owner-id/${id}`, {
          signal: idAbortController.current.signal
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.available === true) {
          setIdAvailable(true);
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.carwash_owner_id;
            return newErrors;
          });
        } else {
          setIdAvailable(false);
          setErrors((prev) => ({
            ...prev,
            carwash_owner_id: "This Owner ID is already taken",
          }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error checking ID:", err);
          setIdAvailable(null);
        }
      } finally {
        setCheckingId(false);
      }
    }, 300);
  }, []);

  // Real-time check if Email is available
  const checkEmailAvailability = useCallback((email) => {
    // Clear any pending timeout
    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }
    
    // Abort any pending request
    if (emailAbortController.current) {
      emailAbortController.current.abort();
    }

    // Reset if empty
    if (!email) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.ownerEmail;
        return newErrors;
      });
      return;
    }

    // Check basic email format first
    const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
    const validDomainRegex = /^[\w.-]+@(gmail\.com|yahoo\.com)$/i;

    if (!emailRegex.test(email)) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      setErrors((prev) => ({
        ...prev,
        ownerEmail: "Please enter a valid email address",
      }));
      return;
    }

    if (!validDomainRegex.test(email)) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      setErrors((prev) => ({
        ...prev,
        ownerEmail: "Only Gmail or Yahoo email addresses are accepted",
      }));
      return;
    }

    // Show checking state immediately
    setCheckingEmail(true);
    setEmailAvailable(null);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.ownerEmail;
      return newErrors;
    });

    // Debounce the actual API call (300ms for faster response)
    emailCheckTimeout.current = setTimeout(async () => {
      emailAbortController.current = new AbortController();
      
      try {
        const res = await fetch(`http://localhost:3000/api/auth/check-email/${encodeURIComponent(email.toLowerCase())}`, {
          signal: emailAbortController.current.signal
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.available === true) {
          setEmailAvailable(true);
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.ownerEmail;
            return newErrors;
          });
        } else {
          setEmailAvailable(false);
          setErrors((prev) => ({
            ...prev,
            ownerEmail: "This email is already registered",
          }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error checking email:", err);
          setEmailAvailable(null);
        }
      } finally {
        setCheckingEmail(false);
      }
    }, 300);
  }, []);

  // Cleanup timeouts and abort controllers on unmount
  useEffect(() => {
    return () => {
      if (idCheckTimeout.current) clearTimeout(idCheckTimeout.current);
      if (emailCheckTimeout.current) clearTimeout(emailCheckTimeout.current);
      if (idAbortController.current) idAbortController.current.abort();
      if (emailAbortController.current) emailAbortController.current.abort();
    };
  }, []);

  // Real-time validation for other fields
  const validateFieldRealtime = (name, value) => {
    switch (name) {
      case "ownerFirstName":
        if (!value) return "";
        if (value.length < 2) return "At least 2 characters required";
        if (!/^[a-zA-Z\s-]+$/.test(value)) return "Letters, spaces, and hyphens only";
        return "";
      
      case "ownerLastName":
        if (!value) return "";
        if (value.length < 2) return "At least 2 characters required";
        if (!/^[a-zA-Z\s-]+$/.test(value)) return "Letters, spaces, and hyphens only";
        return "";
      
      case "ownerPassword": {
        if (!value) return "";
        const missing = [];
        if (value.length < 8) missing.push(`${8 - value.length} more chars`);
        if (!/[A-Z]/.test(value)) missing.push("uppercase");
        if (!/[a-z]/.test(value)) missing.push("lowercase");
        if (!/\d/.test(value)) missing.push("number");
        if (!/[^A-Za-z0-9]/.test(value)) missing.push("special char");
        if (/\s/.test(value)) return "No spaces allowed";
        if (missing.length > 0) return `Need: ${missing.join(", ")}`;
        return "";
      }
      
      case "ownerPhone":
        if (!value) return "";
        if (!/^[\d\s\-+()]*$/.test(value)) return "Invalid characters";
        if (value.replace(/[\s\-+()]/g, "").length > 0 && value.replace(/[\s\-+()]/g, "").length < 10) {
          return `Phone: ${value.replace(/[\s\-+()]/g, "").length}/10 digits`;
        }
        return "";
      
      default:
        return "";
    }
  };

  // Validation for form submission
  const validateField = (name, value) => {
    switch (name) {
      case "ownerFirstName":
        if (!value.trim()) return "First name is required";
        if (value.trim().length < 2) return "First name must be at least 2 characters";
        if (!/^[a-zA-Z\s-]+$/.test(value)) return "First name can only contain letters, spaces, and hyphens";
        return "";
      
      case "ownerLastName":
        if (!value.trim()) return "Last name is required";
        if (value.trim().length < 2) return "Last name must be at least 2 characters";
        if (!/^[a-zA-Z\s-]+$/.test(value)) return "Last name can only contain letters, spaces, and hyphens";
        return "";
      
      case "carwash_owner_id":
        if (!value.trim()) return "Owner ID is required";
        if (!/^\d{5}$/.test(value)) return "Owner ID must be exactly 5 digits";
        if (idAvailable === false) return "This Owner ID is already taken";
        return "";
      
      case "ownerEmail":
        if (!value.trim()) return "Email is required";
        if (!/^[\w.-]+@(gmail\.com|yahoo\.com)$/i.test(value)) {
          return "Please use a valid Gmail or Yahoo email address";
        }
        if (emailAvailable === false) return "This email is already registered";
        return "";
      
      case "ownerPassword":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter";
        if (!/[a-z]/.test(value)) return "Password must include at least one lowercase letter";
        if (!/\d/.test(value)) return "Password must include at least one number";
        if (!/[^A-Za-z0-9]/.test(value)) return "Password must include at least one special character";
        if (/\s/.test(value)) return "Password cannot contain spaces";
        return "";
      
      case "ownerPhone":
        if (value && !/^[\d\s\-+()]{10,15}$/.test(value)) {
          return "Please enter a valid phone number (10-15 digits)";
        }
        return "";
      
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Real-time validation based on field type
    if (name === "carwash_owner_id") {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, "").slice(0, 5);
      if (digitsOnly !== value) {
        setForm((prev) => ({ ...prev, [name]: digitsOnly }));
      }
      checkIdAvailability(digitsOnly);
    } else if (name === "ownerEmail") {
      checkEmailAvailability(value);
    } else {
      // Real-time validation for other fields
      const error = validateFieldRealtime(name, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Skip if already has availability error
    if ((name === "carwash_owner_id" && idAvailable === false) || 
        (name === "ownerEmail" && emailAvailable === false)) {
      return;
    }
    
    // Full validation on blur for required fields
    if (!value && ["ownerFirstName", "ownerLastName", "carwash_owner_id", "ownerEmail", "ownerPassword"].includes(name)) {
      const fieldNames = {
        ownerFirstName: "First name",
        ownerLastName: "Last name",
        carwash_owner_id: "Owner ID",
        ownerEmail: "Email",
        ownerPassword: "Password"
      };
      setErrors((prev) => ({ ...prev, [name]: `${fieldNames[name]} is required` }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(form).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });
    
    if (idAvailable === false) {
      newErrors.carwash_owner_id = "This Owner ID is already taken";
    }
    if (emailAvailable === false) {
      newErrors.ownerEmail = "This email is already registered";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (checkingId || checkingEmail) {
      toast.error("Please wait while we verify your information");
      return;
    }

    if (idAvailable === false || emailAvailable === false) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("http://localhost:3000/api/auth/register-carwash-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerFirstName: form.ownerFirstName.trim(),
          ownerLastName: form.ownerLastName.trim(),
          carwash_owner_id: form.carwash_owner_id,
          ownerEmail: form.ownerEmail.toLowerCase().trim(),
          ownerPassword: form.ownerPassword,
          ownerPhone: form.ownerPhone.trim(),
          ownerAddress: form.ownerAddress.trim(),
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        const errorMessage = (data.error || data.message || "").toLowerCase();
        
        if (errorMessage.includes("id") && (errorMessage.includes("taken") || errorMessage.includes("exists") || errorMessage.includes("duplicate"))) {
          setErrors((prev) => ({ ...prev, carwash_owner_id: "This Owner ID is already taken" }));
          setIdAvailable(false);
          toast.error("Owner ID already in use");
        } else if (errorMessage.includes("email") && (errorMessage.includes("taken") || errorMessage.includes("exists") || errorMessage.includes("duplicate"))) {
          setErrors((prev) => ({ ...prev, ownerEmail: "This email is already registered" }));
          setEmailAvailable(false);
          toast.error("Email already registered");
        } else {
          toast.error(data.error || "Registration failed. Please try again.");
        }
        return;
      }
      
      toast.success("🎉 Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch {
      toast.error("Unable to connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper component for input status indicator
  const InputStatus = ({ checking, available, showSuccess = true }) => {
    if (checking) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    if (available === true && showSuccess) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (available === false) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  // Helper component for status messages
  const StatusMessage = ({ error, successMessage, isAvailable }) => {
    if (error) {
      return (
        <div className="flex items-center gap-1 mt-1 ml-4 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      );
    }
    if (isAvailable === true && successMessage) {
      return (
        <div className="flex items-center gap-1 mt-1 ml-4 text-sm text-green-500">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      );
    }
    return null;
  };

  // Password strength indicator
  const PasswordStrength = ({ password }) => {
    if (!password) return null;
    
    const checks = [
      { test: password.length >= 8, label: "8+ chars" },
      { test: /[A-Z]/.test(password), label: "A-Z" },
      { test: /[a-z]/.test(password), label: "a-z" },
      { test: /\d/.test(password), label: "0-9" },
      { test: /[^A-Za-z0-9]/.test(password), label: "!@#" },
    ];
    
    const passed = checks.filter(c => c.test).length;
    const strength = passed === 5 ? "Strong" : passed >= 3 ? "Medium" : "Weak";
    const color = passed === 5 ? "text-green-500" : passed >= 3 ? "text-yellow-500" : "text-red-500";
    
    return (
      <div className="mt-1 ml-4">
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                i <= passed
                  ? passed === 5
                    ? "bg-green-500"
                    : passed >= 3
                    ? "bg-yellow-500"
                    : "bg-red-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {checks.map((check, i) => (
            <span
              key={i}
              className={check.test ? "text-green-500" : "text-gray-400"}
            >
              {check.test ? "✓" : "○"} {check.label}
            </span>
          ))}
          <span className={`ml-auto font-medium ${color}`}>{strength}</span>
        </div>
      </div>
    );
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
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="flex space-x-2">
            <div className="flex-1">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="ownerFirstName"
                  value={form.ownerFirstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border ${errors.ownerFirstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-cyan-500'} placeholder-gray-400 focus:outline-none focus:ring-2`}
                  placeholder="First Name"
                  required
                />
              </div>
              <StatusMessage error={errors.ownerFirstName} />
            </div>
            <div className="flex-1">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="ownerLastName"
                  value={form.ownerLastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border ${errors.ownerLastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-cyan-500'} placeholder-gray-400 focus:outline-none focus:ring-2`}
                  placeholder="Last Name"
                  required
                />
              </div>
              <StatusMessage error={errors.ownerLastName} />
            </div>
          </div>
          
          {/* Owner ID with real-time check */}
          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="carwash_owner_id"
                value={form.carwash_owner_id}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength={5}
                inputMode="numeric"
                className={`w-full pl-12 pr-12 py-3 bg-white text-black rounded-full border ${
                  errors.carwash_owner_id || idAvailable === false
                    ? 'border-red-500 focus:ring-red-500'
                    : idAvailable === true
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-cyan-500'
                } placeholder-gray-400 focus:outline-none focus:ring-2`}
                placeholder="Owner ID (5 digits)"
                required
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <InputStatus checking={checkingId} available={idAvailable} />
              </div>
            </div>
            <StatusMessage 
              error={errors.carwash_owner_id} 
              successMessage="Owner ID is available!" 
              isAvailable={idAvailable} 
            />
          </div>
          
          {/* Email with real-time check */}
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="ownerEmail"
                value={form.ownerEmail}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-12 py-3 bg-white text-black rounded-full border ${
                  errors.ownerEmail || emailAvailable === false
                    ? 'border-red-500 focus:ring-red-500'
                    : emailAvailable === true
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-cyan-500'
                } placeholder-gray-400 focus:outline-none focus:ring-2`}
                placeholder="Email (Gmail or Yahoo)"
                required
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <InputStatus checking={checkingEmail} available={emailAvailable} />
              </div>
            </div>
            <StatusMessage 
              error={errors.ownerEmail} 
              successMessage="Email is available!" 
              isAvailable={emailAvailable} 
            />
          </div>
          
          {/* Password with strength indicator */}
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="ownerPassword"
                value={form.ownerPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-12 py-3 bg-white text-black rounded-full border ${errors.ownerPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-cyan-500'} placeholder-gray-400 focus:outline-none focus:ring-2`}
                placeholder="Password"
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
            <PasswordStrength password={form.ownerPassword} />
          </div>
          
          <div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="ownerPhone"
                value={form.ownerPhone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border ${errors.ownerPhone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-cyan-500'} placeholder-gray-400 focus:outline-none focus:ring-2`}
                placeholder="Phone (optional)"
              />
            </div>
            <StatusMessage error={errors.ownerPhone} />
          </div>
          
          <div>
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
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || checkingId || checkingEmail}
            className={`w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xl py-3 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg mt-2 ${(isSubmitting || checkingId || checkingEmail) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? "Registering..." : checkingId || checkingEmail ? "Verifying..." : "Register"}
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