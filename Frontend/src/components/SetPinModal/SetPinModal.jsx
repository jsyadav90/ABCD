import { useState } from "react";
import { authAPI } from "../../services/api";
import { validatePINInput } from "../../utils/passwordPolicy";
import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";

/**
 * Reusable Set/Update PIN Modal Component
 * Used in UnifiedUserProfilePage
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Callback when modal closes
 * @param {boolean} props.isUpdate - Whether updating existing PIN or setting new one (default: false)
 * @param {Function} props.onSuccess - Callback after successful PIN operation
 */
const SetPinModal = ({ isOpen, onClose, isUpdate = false, onSuccess }) => {
  const [formData, setFormData] = useState({
    pin: "",
    confirmPin: "",
    oldPin: "",
    error: "",
    isSubmitting: false,
  });

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      error: "", // Clear error on input change
    }));
  };

  // Validate form
  const validateForm = () => {
    if (isUpdate && !formData.oldPin) {
      setFormData(prev => ({ ...prev, error: "Current PIN is required" }));
      return false;
    }

    if (!formData.pin) {
      setFormData(prev => ({ ...prev, error: "PIN is required" }));
      return false;
    }

    if (!formData.confirmPin) {
      setFormData(prev => ({ ...prev, error: "Confirm PIN is required" }));
      return false;
    }

    // Validate PIN using password policy function
    const pinValidationError = validatePINInput(formData.pin);
    if (pinValidationError) {
      setFormData(prev => ({ ...prev, error: pinValidationError }));
      return false;
    }

    if (formData.pin !== formData.confirmPin) {
      setFormData(prev => ({ ...prev, error: "PINs do not match" }));
      return false;
    }

    return true;
  };

  // Handle PIN submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFormData(prev => ({ ...prev, isSubmitting: true, error: "" }));

    try {
      if (isUpdate) {
        await authAPI.updatePin(formData.oldPin, formData.pin);
        alert("PIN updated successfully");
      } else {
        await authAPI.setPin(formData.pin);
        alert("PIN set successfully");
      }
      
      handleClose();
      onSuccess?.();
    } catch (err) {
      setFormData(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: err.response?.data?.message || `Failed to ${isUpdate ? "update" : "set"} PIN` 
      }));
    }
  };

  // Handle modal close and reset form
  const handleClose = () => {
    setFormData({
      pin: "",
      confirmPin: "",
      oldPin: "",
      error: "",
      isSubmitting: false,
    });
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isUpdate ? "Update PIN" : "Set PIN"}
    >
      <div className="modal-body">
        {/* Dummy inputs to prevent Edge/Chrome autofill */}
        <input type="text" style={{ display: "none" }} aria-hidden="true" />
        <input type="password" style={{ display: "none" }} aria-hidden="true" autoComplete="new-password" />

        {isUpdate && (
          <Input
            type="password"
            label="Current PIN"
            placeholder="Enter current PIN"
            value={formData.oldPin}
            onChange={(e) => handleInputChange("oldPin", e.target.value)}
            required
            disabled={formData.isSubmitting}
            autoComplete="one-time-code"
            name="current-pin-input"
          />
        )}
        <Input
          type="password"
          label={isUpdate ? "New PIN" : "Set PIN"}
          placeholder="Enter PIN (4-6 digits)"
          value={formData.pin}
          onChange={(e) => handleInputChange("pin", e.target.value)}
          required
          disabled={formData.isSubmitting}
          maxLength="6"
          autoComplete="one-time-code"
          name="new-pin-input"
        />
        <Input
          type="password"
          label="Confirm PIN"
          placeholder="Enter PIN again"
          value={formData.confirmPin}
          onChange={(e) => handleInputChange("confirmPin", e.target.value)}
          required
          disabled={formData.isSubmitting}
          maxLength="6"
          autoComplete="one-time-code"
          name="confirm-pin-input"
        />
        {formData.error && (
          <div className="modal-error">{formData.error}</div>
        )}
      </div>
      <div className="modal-footer">
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={formData.isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={formData.isSubmitting}
        >
          {formData.isSubmitting ? "Saving..." : isUpdate ? "Update PIN" : "Set PIN"}
        </Button>
      </div>
    </Modal>
  );
};

export default SetPinModal;
