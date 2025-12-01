import { useState, useEffect } from "react";
import { X } from "lucide-react";

function ReportModal({ isOpen, onClose, onSubmit, shop }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason(""); // Reset reason when modal opens
    }
  }, [isOpen]);

  if (!isOpen || !shop) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Report Carwash Shop
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          You are reporting:{" "}
          <span className="font-bold">{shop.carwashName}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="report-reason"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Reason for reporting
          </label>
          <textarea
            id="report-reason"
            rows="4"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide details about why you are reporting this shop..."
            required
          ></textarea>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300"
              disabled={!reason.trim()}
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;