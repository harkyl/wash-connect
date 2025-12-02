import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, FileText, Upload, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";

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

  const handleLogoChange = (e) => {
    setLogoFile(e.target.files[0]);
    if (errors.logo) {
      setErrors({ ...errors, logo: null });
    }
    setSuccess("");
  };
  const handleRequirementsChange = (e) => {
    setRequirementsFile(e.target.files[0]);
    if (errors.requirements) {
      setErrors({ ...errors, requirements: null });
    }
    setSuccess("");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-100">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 border border-gray-200">
        <button
          className="mb-6 p-2 hover:bg-black/10 rounded-full transition-colors"
          onClick={() => navigate("/carwash-login")}
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
          Carwash Application Registration
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit} encType="multipart/form-data">
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
          <div>
            <label className="block mb-1 font-medium text-gray-700">Company Logo</label>
            <div className="flex items-center gap-3">
              <label className={`flex items-center cursor-pointer bg-cyan-50 border ${errors.logo ? 'border-red-500' : 'border-cyan-200'} px-4 py-2 rounded-full hover:bg-cyan-100 transition`}>
                <Upload className="w-5 h-5 mr-2 text-cyan-500" />
                <span className="text-cyan-700 font-medium">Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              {logoFile && (
                <span className="text-gray-700 text-sm truncate">{logoFile.name}</span>
              )}
            </div>
            {errors.logo && <p className="text-red-500 text-sm mt-1">{errors.logo}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Requirements (PDF or Word)</label>
            <div className="flex items-center gap-3">
              <label className={`flex items-center cursor-pointer bg-cyan-50 border ${errors.requirements ? 'border-red-500' : 'border-cyan-200'} px-4 py-2 rounded-full hover:bg-cyan-100 transition`}>
                <FileText className="w-5 h-5 mr-2 text-cyan-500" />
                <span className="text-cyan-700 font-medium">Upload File</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleRequirementsChange}
                  className="hidden"
                />
              </label>
              {requirementsFile && (
                <span className="text-gray-700 text-sm truncate">{requirementsFile.name}</span>
              )}
            </div>
            {errors.requirements && <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>}
          </div>
          {errors.general && (
            <div className="flex items-center p-4 text-sm text-red-800 rounded-lg bg-red-100" role="alert">
              <AlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3" />
              <div>
                <span className="font-medium">{errors.general}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="flex items-center p-4 text-sm text-green-800 rounded-lg bg-green-100" role="alert">
              <CheckCircle2 className="flex-shrink-0 inline w-5 h-5 mr-3" />
              <div>
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xl py-3 rounded-full font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg mt-2"
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