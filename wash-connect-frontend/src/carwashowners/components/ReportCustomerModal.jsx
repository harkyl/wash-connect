import React, { useState, useEffect } from 'react';

const nameFor = (c) => {
  if (!c) return "";
  return (c.customer_name || `${c.customer_first_name || ""} ${c.customer_last_name || ""}` || "").trim();
};

function ReportCustomerModal({ isOpen, onClose, onSubmit, customer, isSubmitting }) {
  const [reason, setReason] = useState('');

  // Reset reason when the modal is opened for a new customer
  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for the report.");
      return;
    }
    onSubmit(reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-2">Report Customer</h2>
        <p className="mb-4 text-gray-600">
          You are reporting{" "}
          <span className="font-semibold">{nameFor(customer)}</span>.
        </p>
        <textarea
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="4"
          placeholder="Please state the reason for the report..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isSubmitting}
        ></textarea>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 transition-colors"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportCustomerModal;