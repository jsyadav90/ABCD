import { useCallback, useEffect, useState } from "react";
import { organizationAPI } from "../../../services/api.js";
import { useAuth } from "../../../hooks/useAuth";
import { Button, Input, Card, Alert, Checkbox } from "../../../components";
import "./OrganizationTab.css";

const OrganizationTab = ({ setToast }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const [policy, setPolicy] = useState({
    enabled: false,
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
    allowSpaces: false,
    passwordHistoryCount: 5,
    minimumChangeCooldownMinutes: 5,
  });

  const fetchOrganization = useCallback(async () => {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const response = await organizationAPI.getById(user.organizationId);
      const data = response.data?.data || response.data;
      setOrgData(data);
      
      const enabledFeatures = data.enabledFeatures || [];
      const hasPolicyFeature = enabledFeatures.includes("PASSWORD_POLICY");
      const existingPolicy = data.settings?.passwordPolicy || {};
      
      setPolicy({
        ...policy,
        ...existingPolicy,
        enabled: hasPolicyFeature && (existingPolicy.enabled ?? true)
      });
    } catch (err) {
      console.error("Failed to fetch organization:", err);
      setToast({ type: "danger", message: "Failed to load organization settings" });
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId, setToast]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPolicy(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare enabledFeatures
      const features = orgData.enabledFeatures || [];
      const newFeatures = policy.enabled 
        ? [...new Set([...features, "PASSWORD_POLICY"])]
        : features.filter(f => f !== "PASSWORD_POLICY");

      const updateData = {
        enabledFeatures: newFeatures,
        settings: {
          ...(orgData.settings || {}),
          passwordPolicy: {
            ...policy,
            enabled: policy.enabled // Ensure this matches feature flag for consistency
          }
        }
      };

      await organizationAPI.update(user.organizationId, updateData);
      setToast({ type: "success", message: "Organization settings updated successfully" });
      
      // Refresh local data
      setOrgData(prev => ({
        ...prev,
        enabledFeatures: newFeatures,
        settings: updateData.settings
      }));
    } catch (err) {
      console.error("Failed to update organization:", err);
      setToast({ type: "danger", message: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="org-tab-loading">Loading organization settings...</div>;

  return (
    <>
    <div className="organization-tab">
      <div className="org-tab-content">
        {/* Password Policy Section */}
        <Card title="Password Policy" className="policy-card">
          <div className="policy-main-toggle">
            <Checkbox
              label="Enable Password Policy"
              name="enabled"
              checked={policy.enabled}
              onChange={handleInputChange}
            />
            <p className="field-hint">When enabled, all users must follow these password rules.</p>
          </div>

          {policy.enabled && (
            <div className="policy-rules-grid">
              <div className="policy-rule-group">
                <h3>Length Rules</h3>
                <div className="rule-inputs">
                  <Input
                    label="Minimum Length"
                    type="number"
                    name="minLength"
                    value={policy.minLength}
                    onChange={handleInputChange}
                    min={8}
                    max={32}
                  />
                  <Input
                    label="Maximum Length"
                    type="number"
                    name="maxLength"
                    value={policy.maxLength}
                    onChange={handleInputChange}
                    min={policy.minLength}
                    max={128}
                  />
                </div>
              </div>

              <div className="policy-rule-group">
                <h3>Character Requirements</h3>
                <div className="rule-checkboxes">
                  <Checkbox
                    label="Require Uppercase Letter"
                    name="requireUppercase"
                    checked={policy.requireUppercase}
                    onChange={handleInputChange}
                  />
                  <Checkbox
                    label="Require Lowercase Letter"
                    name="requireLowercase"
                    checked={policy.requireLowercase}
                    onChange={handleInputChange}
                  />
                  <Checkbox
                    label="Require Number"
                    name="requireNumber"
                    checked={policy.requireNumber}
                    onChange={handleInputChange}
                  />
                  <Checkbox
                    label="Require Special Character"
                    name="requireSpecial"
                    checked={policy.requireSpecial}
                    onChange={handleInputChange}
                  />
                  <Checkbox
                    label="Allow Spaces"
                    name="allowSpaces"
                    checked={policy.allowSpaces}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="policy-rule-group">
                <h3>History & Cooldown</h3>
                <div className="rule-inputs">
                  <Input
                    label="Password History Count"
                    type="number"
                    name="passwordHistoryCount"
                    value={policy.passwordHistoryCount}
                    onChange={handleInputChange}
                    min={1}
                    max={10}
                    placeholder="Last N passwords cannot be reused"
                  />
                  <Input
                    label="Min Change Cooldown (Minutes)"
                    type="number"
                    name="minimumChangeCooldownMinutes"
                    value={policy.minimumChangeCooldownMinutes}
                    onChange={handleInputChange}
                    min={0}
                    max={1440}
                    placeholder="Minutes between password changes"
                  />
                </div>
                <p className="field-hint">Cooldown prevents rapid password recycling.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Future sections can be added here */}
        <div className="future-placeholder">
          <Alert type="info">
            More organization-wide settings (like session timeouts, IP whitelisting, and multi-factor authentication) will be available soon.
          </Alert>
        </div>
      </div>

      <div className="org-tab-actions">
        <Button 
          variant="primary" 
          onClick={handleSave} 
          loading={saving}
          disabled={saving}
        >
          Save All Settings
        </Button>
      </div>
    </div>
    </>
  );
};

export default OrganizationTab;
