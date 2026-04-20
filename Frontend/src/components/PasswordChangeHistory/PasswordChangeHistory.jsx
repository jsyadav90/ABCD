import { useEffect, useState } from "react";
import { authAPI } from "../../services/api";
import "./PasswordChangeHistory.css";

/**
 * Password Change History Component
 * Displays audit trail of password changes with details about who changed it, when, and from where
 */
const PasswordChangeHistory = ({ userId = null, limit = 10 }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await authAPI.getPasswordChangeHistory(limit);
        const historyData = response.data?.data?.history || [];
        setHistory(historyData);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load password change history");
        console.error("Failed to fetch password change history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [limit]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    }).format(date);
  };

  const getChangeTypeColor = (changeType) => {
    const colors = {
      SelfInitiated: "#4CAF50",
      AdminForcedReset: "#FF9800",
      AdminPasswordSet: "#FF9800",
      PasswordExpiry: "#2196F3",
      SecurityQuestion: "#9C27B0",
      TwoFactorVerification: "#00BCD4",
      SystemReset: "#F44336",
    };
    return colors[changeType] || "#666";
  };

  const getChangedByBadge = (changedBy) => {
    const badges = {
      Self: { bg: "#E8F5E9", color: "#2E7D32", text: "Self" },
      Admin: { bg: "#FFF3E0", color: "#E65100", text: "Admin" },
      System: { bg: "#F3E5F5", color: "#6A1B9A", text: "System" },
    };
    const badge = badges[changedBy] || badges.Self;
    return badge;
  };

  if (loading) {
    return (
      <div className="password-history-container">
        <div className="loading-spinner">Loading password change history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="password-history-container">
        <div className="error-message">⚠️ {error}</div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="password-history-container">
        <div className="empty-state">
          <p>📝 No password change history found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="password-history-container">
      <div className="history-header">
        <h3>🔐 Password Change History</h3>
        <span className="record-count">{history.length} records</span>
      </div>

      <div className="history-list">
        {history.map((record, index) => {
          const changedByBadge = getChangedByBadge(record.changedBy);
          return (
            <div key={index} className="history-item">
              <div className="item-header">
                <div className="item-time">
                  <span className="time-icon">🕐</span>
                  <span className="time-text">{formatDate(record.changedAt)}</span>
                </div>
                <div className="item-badges">
                  <span
                    className="badge changed-by"
                    style={{ backgroundColor: changedByBadge.bg, color: changedByBadge.color }}
                  >
                    {changedByBadge.text}
                  </span>
                  <span
                    className="badge change-type"
                    style={{ backgroundColor: getChangeTypeColor(record.changeType), color: "#fff" }}
                  >
                    {record.changeType}
                  </span>
                </div>
              </div>

              <div className="item-details">
                <div className="detail-row">
                  <span className="detail-label">🔄 Method:</span>
                  <span className="detail-value">{record.method || "Direct Change"}</span>
                </div>

                {record.changedByUsername && (
                  <div className="detail-row">
                    <span className="detail-label">👤 Changed by:</span>
                    <span className="detail-value">{record.changedByUsername}</span>
                  </div>
                )}

                {record.ipAddress && (
                  <div className="detail-row">
                    <span className="detail-label">🌐 IP Address:</span>
                    <span className="detail-value detail-ip">{record.ipAddress}</span>
                  </div>
                )}

                {record.deviceId && (
                  <div className="detail-row">
                    <span className="detail-label">📱 Device ID:</span>
                    <span className="detail-value detail-device">{record.deviceId}</span>
                  </div>
                )}

                {record.reason && (
                  <div className="detail-row">
                    <span className="detail-label">📌 Reason:</span>
                    <span className="detail-value">{record.reason}</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">✓ Status:</span>
                  <span
                    className="detail-value"
                    style={{
                      color: record.status === "Completed" ? "#4CAF50" : "#FF9800",
                      fontWeight: "bold",
                    }}
                  >
                    {record.status}
                  </span>
                </div>

                {record.mfaVerified && (
                  <div className="detail-row">
                    <span className="detail-label">🔒 MFA:</span>
                    <span className="detail-value" style={{ color: "#4CAF50" }}>
                      ✓ Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordChangeHistory;
