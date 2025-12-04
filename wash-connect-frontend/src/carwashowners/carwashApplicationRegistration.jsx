import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, FileText, Upload, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Image } from "lucide-react";

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
const ALLOWED_DOC_EXTENSIONS = [".pdf", ".doc", ".docx"];

function CarwashApplicationRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    carwashName: "",
    location: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [requirementsFile, setRequirementsFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // File validation state for better UX
  const [logoValid, setLogoValid] = useState(null); // null = not set, true = valid, false = invalid
  const [requirementsValid, setRequirementsValid] = useState(null);

  // Redirect if already registered (checks backend)
  useEffect(() => {
    const owner = JSON.parse(localStorage.getItem("carwashOwner"));
    if (!owner || !owner.id) return;
    // Check registration status from backend
    fetch(`http://localhost:3000/api/carwash-applications/status/${owner.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.registered) {
          navigate("/carwash-dashboard");
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
    setSuccess("");
  };

  // Validate image file
  const validateImageFile = (file) => {
    if (!file) return { valid: false, error: "No file selected" };
    
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidExtension = ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension);
    
    if (!isValidType && !isValidExtension) {
      return {
        valid: false,
        error: `Invalid file format "${fileExtension}". Please upload an image (${ALLOWED_IMAGE_EXTENSIONS.join(", ")})`
      };
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: "File is too large. Maximum size is 5MB"
      };
    }
    
    return { valid: true, error: null };
  };

  // Validate document file
  const validateDocFile = (file) => {
    if (!file) return { valid: false, error: "No file selected" };
    
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    const isValidType = ALLOWED_DOC_TYPES.includes(file.type);
    const isValidExtension = ALLOWED_DOC_EXTENSIONS.includes(fileExtension);
    
    if (!isValidType && !isValidExtension) {
      return {
        valid: false,
        error: `Invalid file format "${fileExtension}". Please upload a document (${ALLOWED_DOC_EXTENSIONS.join(", ")})`
      };
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: "File is too large. Maximum size is 10MB"
      };
    }
    
    return { valid: true, error: null };
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    
    if (validation.valid) {
      setLogoFile(file);
      setLogoValid(true);
      setErrors({ ...errors, logo: null });
    } else {
      setLogoFile(null);
      setLogoValid(false);
      setErrors({ ...errors, logo: validation.error });
      // Reset the input
      e.target.value = "";
    }
    setSuccess("");
  };

  const handleRequirementsChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateDocFile(file);
    
    if (validation.valid) {
      setRequirementsFile(file);
      setRequirementsValid(true);
      setErrors({ ...errors, requirements: null });
    } else {
      setRequirementsFile(null);
      setRequirementsValid(false);
      setErrors({ ...errors, requirements: validation.error });
      // Reset the input
      e.target.value = "";
    }
    setSuccess("");
  };

  // Clear file handlers
  const clearLogo = () => {
    setLogoFile(null);
    setLogoValid(null);
    setErrors({ ...errors, logo: null });
  };

  const clearRequirements = () => {
    setRequirementsFile(null);
    setRequirementsValid(null);
    setErrors({ ...errors, requirements: null });
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");

    // --- Validation ---
    const newErrors = {};
    if (!form.carwashName) newErrors.carwashName = "Company Name is required.";
    if (!form.location) newErrors.location = "Business Location is required.";
    if (!logoFile) newErrors.logo = "Company logo is required.";
    if (!requirementsFile) newErrors.requirements = "Requirements file is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const owner = JSON.parse(localStorage.getItem("carwashOwner"));
      if (!owner || !owner.id) {
        setErrors({ general: "Owner not authenticated. Please log in again." });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("carwashName", form.carwashName);
      formData.append("location", form.location);
      formData.append("logo", logoFile);
      formData.append("requirements", requirementsFile);
      formData.append("ownerId", owner.id);

      const res = await fetch("http://localhost:3000/api/carwash-applications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error || "Submission failed" });
        setLoading(false);
        return;
      }
      // Optionally update localStorage if backend returns owner info
      if (data.owner) {
        localStorage.setItem("carwashOwner", JSON.stringify(data.owner));
      }
      setSuccess("Application submitted! Await admin approval.");
      setLoading(false);
      setTimeout(() => navigate("/awaiting-approval"), 1200);
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
      setLoading(false);
    }
  };

  // Helper component for file status indicator
  const FileStatusIndicator = ({ isValid, fileName, onClear }) => {
    if (isValid === null) return null;
    
    return (
      <div className={`flex items-center gap-2 mt-2 p-2 rounded-lg ${
        isValid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
      }`}>
        {isValid ? (
          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
        <span className={`text-sm truncate flex-1 ${isValid ? "text-green-700" : "text-red-700"}`}>
          {isValid ? fileName : "Invalid file"}
        </span>
        {isValid && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 hover:bg-green-100 rounded-full transition-colors"
            title="Remove file"
          >
            <XCircle className="w-4 h-4 text-green-600" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100 px-4 py-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 sm:p-10 border border-gray-200">
        <button
          className="mb-6 p-2 hover:bg-black/10 rounded-full transition-colors"
          onClick={() => navigate("/carwash-login")}
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <h1
          className="text-3xl sm:text-4xl mb-2 text-center"
          style={{ fontFamily: "Brush Script MT, cursive" }}
        >
          <span className="text-cyan-500">Wash</span>{" "}
          <span className="text-red-500">Connect</span>
        </h1>
        <h2 className="text-cyan-500 text-xl sm:text-2xl font-medium italic mb-6 text-center">
          Carwash Application Registration
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Company Name */}
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="carwashName"
              value={form.carwashName}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border ${errors.carwashName ? 'border-red-500' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              placeholder="Company Name"
            />
            {errors.carwashName && <p className="text-red-500 text-sm mt-1 ml-4">{errors.carwashName}</p>}
          </div>

          {/* Business Location */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3 bg-white text-black rounded-full border ${errors.location ? 'border-red-500' : 'border-gray-300'} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              placeholder="Business Location"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1 ml-4">{errors.location}</p>}
          </div>

          {/* Company Logo Upload */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Company Logo</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className={`flex items-center cursor-pointer border px-4 py-2.5 rounded-full transition-all ${
                errors.logo 
                  ? 'bg-red-50 border-red-300 hover:bg-red-100' 
                  : logoValid 
                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                    : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
              }`}>
                {errors.logo ? (
                  <XCircle className="w-5 h-5 mr-2 text-red-500" />
                ) : logoValid ? (
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                ) : (
                  <Image className="w-5 h-5 mr-2 text-cyan-500" />
                )}
                <span className={`font-medium ${
                  errors.logo ? 'text-red-700' : logoValid ? 'text-green-700' : 'text-cyan-700'
                }`}>
                  {logoValid ? "Change Logo" : "Upload Logo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Logo file status */}
            <FileStatusIndicator 
              isValid={logoValid} 
              fileName={logoFile?.name} 
              onClear={clearLogo}
            />
            
            {/* Error message with format hint */}
            {errors.logo && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 text-sm font-medium">{errors.logo}</p>
                  <p className="text-red-600 text-xs mt-1">
                    Supported formats: JPG, PNG, GIF, WebP, SVG (max 5MB)
                  </p>
                </div>
              </div>
            )}
            
            {/* Format hint when no file selected */}
            {!logoFile && !errors.logo && (
              <p className="text-gray-500 text-xs mt-2 ml-1">
                Accepted formats: JPG, PNG, GIF, WebP, SVG (max 5MB)
              </p>
            )}
          </div>

          {/* Requirements Upload */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Requirements (PDF or Word)</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className={`flex items-center cursor-pointer border px-4 py-2.5 rounded-full transition-all ${
                errors.requirements 
                  ? 'bg-red-50 border-red-300 hover:bg-red-100' 
                  : requirementsValid 
                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                    : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
              }`}>
                {errors.requirements ? (
                  <XCircle className="w-5 h-5 mr-2 text-red-500" />
                ) : requirementsValid ? (
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                ) : (
                  <FileText className="w-5 h-5 mr-2 text-cyan-500" />
                )}
                <span className={`font-medium ${
                  errors.requirements ? 'text-red-700' : requirementsValid ? 'text-green-700' : 'text-cyan-700'
                }`}>
                  {requirementsValid ? "Change File" : "Upload File"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleRequirementsChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Requirements file status */}
            <FileStatusIndicator 
              isValid={requirementsValid} 
              fileName={requirementsFile?.name} 
              onClear={clearRequirements}
            />
            
            {/* Error message with format hint */}
            {errors.requirements && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 text-sm font-medium">{errors.requirements}</p>
                  <p className="text-red-600 text-xs mt-1">
                    Supported formats: PDF, DOC, DOCX (max 10MB)
                  </p>
                </div>
              </div>
            )}
            
            {/* Format hint when no file selected */}
            {!requirementsFile && !errors.requirements && (
              <p className="text-gray-500 text-xs mt-2 ml-1">
                Accepted formats: PDF, DOC, DOCX (max 10MB)
              </p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="flex items-center p-4 text-sm text-red-800 rounded-lg bg-red-100" role="alert">
              <AlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3" />
              <div>
                <span className="font-medium">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center p-4 text-sm text-green-800 rounded-lg bg-green-100" role="alert">
              <CheckCircle2 className="flex-shrink-0 inline w-5 h-5 mr-3" />
              <div>
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg sm:text-xl py-3 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CarwashApplicationRegistration;