import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";

/**
 * Reusable Re-authentication Modal Component
 * Used when session expires and user needs to re-authenticate
 * Supports both Password and PIN (if PIN is set)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSuccess - Callback after successful re-authentication
 * @param {boolean} props.isPinSet - Whether PIN is set for the user (optional)
 */
const ReauthModal = ({ isOpen, onClose, onSuccess, isPinSet = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    credential: "",
    credentialType: "password", // "password" or "pin"
    error: "",
    isSubmitting: false,
    failedPinAttempts: 0, // Track failed PIN attempts
  });

  // When modal opens, reset form
  useEffect(() => {
    if (isOpen) {
      setFormData({
        credential: "",
        credentialType: "password",
        error: "",
        isSubmitting: false,
        failedPinAttempts: 0,
      });
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      error: "", // Clear error on input change
    }));
  };

  // Toggle between password and PIN input
  // Only allowed if PIN is set and failed attempts < 5
  const toggleCredentialType = () => {
    if (!isPinSet || formData.failedPinAttempts >= 5) {
      return; // Don't allow toggle
    }
    setFormData(prev => ({
      ...prev,
      credential: "",
      credentialType: prev.credentialType === "password" ? "pin" : "password",
      error: "",
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.credential) {
      setFormData(prev => ({ 
        ...prev, 
        error: `${formData.credentialType === "password" ? "Password" : "PIN"} is required` 
      }));
      return false;
    }

    if (formData.credentialType === "pin" && !/^\d{4,6}$/.test(formData.credential)) {
      setFormData(prev => ({ ...prev, error: "PIN must be 4-6 digits" }));
      return false;
    }

    return true;
  };

  // Handle re-authentication submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFormData(prev => ({ ...prev, isSubmitting: true, error: "" }));

    try {
      const deviceId = localStorage.getItem('deviceId');
      await authAPI.reauth({
        credentialType: formData.credentialType,
        credential: formData.credential,
        deviceId,
      });
      
      handleClose();
      onSuccess?.();
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Failed to re-authenticate`;
      
      // Track failed PIN attempts
      let newFailedAttempts = formData.failedPinAttempts;
      if (formData.credentialType === "pin" && errorMessage.includes("Invalid pin")) {
        newFailedAttempts = (formData.failedPinAttempts || 0) + 1;
      }

      setFormData(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMessage,
        failedPinAttempts: newFailedAttempts,
      }));

      // After 5 failed PIN attempts, force to use password only
      if (newFailedAttempts >= 5 && formData.credentialType === "pin") {
        setFormData(prev => ({
          ...prev,
          credentialType: "password",
          credential: "",
          error: "Too many failed PIN attempts. Please use password.",
        }));
      }
    }
  };

  // Handle modal close and reset form
  const handleClose = () => {
    setFormData({
      credential: "",
      credentialType: "password",
      error: "",
      isSubmitting: false,
      failedPinAttempts: 0,
    });
    onClose?.();
  };

  // Determine if toggle button should be shown
  const canToggle = isPinSet && formData.failedPinAttempts < 5;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Session Expired - Re-authenticate"
      closeButton={false}
    >
      <div className="modal-body">
        <p className="modal-description" style={{ marginBottom: "20px", color: "#666" }}>
          {isPinSet ? (
            <>Your session has expired. Please enter your <strong>{formData.credentialType}</strong> to continue.</>
          ) : (
            <>Your session has expired. Please enter your <strong>password</strong> to continue.</>
          )}
        </p>
        
        <Input
          type={formData.credentialType === "password" ? "password" : "text"}
          label={formData.credentialType === "password" ? "Password" : "PIN"}
          placeholder={formData.credentialType === "password" ? "Enter your password" : "Enter your PIN (4-6 digits)"}
          value={formData.credential}
          onChange={(e) => handleInputChange("credential", e.target.value)}
          required
          disabled={formData.isSubmitting}
          maxLength={formData.credentialType === "pin" ? 6 : undefined}
          autoComplete={formData.credentialType === "password" ? "current-password" : "off"}
        />

        {formData.error && (
          <div className="modal-error">{formData.error}</div>
        )}

        {/* Toggle button - only show if PIN is set and < 5 failed attempts */}
        {canToggle && (
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              onClick={toggleCredentialType}
              disabled={formData.isSubmitting}
              style={{
                background: "none",
                border: "none",
                color: "#4338ca",
                cursor: formData.isSubmitting ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                textDecoration: "underline",
                padding: "0",
                opacity: formData.isSubmitting ? 0.6 : 1,
              }}
            >
              {formData.credentialType === "password" ? "Use PIN instead" : "Use password instead"}
            </button>
          </div>
        )}

        {/* Show message when forced to use password */}
        {formData.failedPinAttempts >= 5 && (
          <div style={{ 
            marginTop: "12px", 
            padding: "8px 12px", 
            backgroundColor: "#fef2f2", 
            border: "1px solid #fca5a5", 
            borderRadius: "6px",
            fontSize: "0.85rem",
            color: "#991b1b"
          }}>
            Too many failed PIN attempts. Please use your password to continue.
          </div>
        )}
      </div>
      <div className="modal-footer">
        <Button
          variant="secondary"
          onClick={() => {
            handleClose();
            navigate("/login");
          }}
          disabled={formData.isSubmitting}
        >
          Go to Login
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={formData.isSubmitting}
        >
          {formData.isSubmitting ? "Verifying..." : "Continue"}
        </Button>
      </div>
    </Modal>
  );
};

export default ReauthModal;
