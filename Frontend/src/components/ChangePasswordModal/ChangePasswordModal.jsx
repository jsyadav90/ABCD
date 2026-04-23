import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authAPI } from "../../services/api";
import { validatePasswordInput } from "../../utils/passwordPolicy";
import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";

/**
 * Reusable Change Password Modal Component
 * Used in Sidebar and UnifiedUserProfilePage
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Callback when modal closes
 * @param {boolean} props.isForceChange - If true, prevents closing and shows warning
 */
const ChangePasswordModal = ({ isOpen, onClose, isForceChange = false }) => {
  const navigate = useNavigate();
  const { logout, user, orgSettings } = useAuth();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
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
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setFormData(prev => ({ ...prev, error: "All fields are required" }));
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setFormData(prev => ({ ...prev, error: "New passwords do not match" }));
      return false;
    }

    const identityCandidates = [user?.userId, user?.name, user?.email].filter(Boolean);
    const policy = orgSettings?.passwordPolicy || null;
    const passwordError = validatePasswordInput(formData.newPassword, identityCandidates, policy);
    if (passwordError) {
      setFormData(prev => ({ ...prev, error: passwordError }));
      return false;
    }

    return true;
  };

  // Handle password change submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFormData(prev => ({ ...prev, isSubmitting: true, error: "" }));

    try {
      await authAPI.changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      
      alert("Password changed successfully. Please login again.");
      handleClose();
      logout?.();
      navigate("/login");
    } catch (err) {
      setFormData(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: err.response?.data?.message || "Failed to change password" 
      }));
    }
  };

  // Handle modal close and reset form
  const handleClose = () => {
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      error: "",
      isSubmitting: false,
    });
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isForceChange ? undefined : handleClose}
      title={isForceChange ? "Force Password Change" : "Change Password"}
      closeButton={!isForceChange}
    >
      <div className="modal-body">
        {isForceChange && (
          <div className="modal-warning" style={{ color: '#d9534f', marginBottom: '15px', fontWeight: 'bold' }}>
            Your password has expired or needs to be changed for security reasons. Please change it to continue.
          </div>
        )}
        {/* Dummy inputs to prevent Edge/Chrome autofill */}
        <input type="text" style={{ display: "none" }} aria-hidden="true" />
        <input type="password" style={{ display: "none" }} aria-hidden="true" autoComplete="new-password" />

        <Input
          type="password"
          label="Current Password"
          placeholder="Enter current password"
          value={formData.oldPassword}
          onChange={(e) => handleInputChange("oldPassword", e.target.value)}
          required
          disabled={formData.isSubmitting}
          autoComplete="new-password"
          name="old-pwd-field"
        />
        <Input
          type="password"
          label="New Password"
          placeholder="Min 8 with upper, lower, number, special"
          value={formData.newPassword}
          onChange={(e) => handleInputChange("newPassword", e.target.value)}
          required
          disabled={formData.isSubmitting}
          autoComplete="new-password"
          name="new-pwd-field"
        />
        <Input
          type="password"
          label="Confirm New Password"
          placeholder="Enter new password again"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
          required
          disabled={formData.isSubmitting}
          autoComplete="new-password"
          name="confirm-pwd-field"
        />
        {formData.error && (
          <div className="modal-error">{formData.error}</div>
        )}
      </div>
      <div className="modal-footer">
        {!isForceChange && (
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={formData.isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={formData.isSubmitting}
          fullWidth={isForceChange}
        >
          {formData.isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
