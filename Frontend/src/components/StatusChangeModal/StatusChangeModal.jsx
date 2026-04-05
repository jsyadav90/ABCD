import { useState } from "react";
import "./StatusChangeModal.css";

/**
 * Modal to prompt user for reason when changing asset status
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {string} props.assetName - Name/model of asset
 * @param {boolean} props.newStatus - New status (true = activate, false = deactivate)
 * @param {Function} props.onConfirm - Callback with reason when confirmed
 * @param {Function} props.onCancel - Callback when cancelled
 */
const StatusChangeModal = ({ isOpen, assetName, newStatus, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Please provide a reason for this action");
      return;
    }
    setError("");
    onConfirm(reason.trim());
    setReason("");
  };

  const handleCancel = () => {
    setError("");
    setReason("");
    onCancel();
  };

  const action = newStatus ? "activate" : "deactivate";
  const actionCapitalized = newStatus ? "Activate" : "Deactivate";

  return (
    <div className="status-change-modal-overlay">
      <div className="status-change-modal">
        <div className="status-change-modal__header">
          <h2>{actionCapitalized} Asset</h2>
          <button
            className="status-change-modal__close"
            onClick={handleCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="status-change-modal__content">
          <p>
            You are about to <strong>{action}</strong> <em>{assetName}</em>.
          </p>
          <p>Please provide a reason for this action:</p>

          <textarea
            className="status-change-modal__textarea"
            placeholder={`Enter reason for ${action}...`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="4"
          />

          {error && <div className="status-change-modal__error">{error}</div>}
        </div>

        <div className="status-change-modal__footer">
          <button
            className="status-change-modal__btn status-change-modal__btn--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={`status-change-modal__btn status-change-modal__btn--${
              newStatus ? "activate" : "deactivate"
            }`}
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            {actionCapitalized}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusChangeModal;
