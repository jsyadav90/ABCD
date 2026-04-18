/**
 * Page: Endpoints
 * Description: Endpoint management page for Module 2 - shows and manages endpoints
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/Card/Card.jsx";
import Button from "../../components/Button/Button.jsx";
import { PageLoader } from "../../components/Loader/Loader.jsx";
import { ErrorNotification } from "../../components/ErrorBoundary/ErrorNotification.jsx";
import { getSelectedBranch } from "../../utils/scope";
import { authAPI } from "../../services/api.js";
import "./Endpoints.css";
import { hasAllPermissions, hasPermission } from "../../utils/permissionHelper.js";

const Endpoints = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [selectedBranch] = useState(getSelectedBranch() || "");

  // Mock endpoint data for now - replace with actual API call
  const mockEndpoints = [
    {
      id: 1,
      name: "Endpoint 1",
      type: "Desktop",
      status: "Active",
      ipAddress: "192.168.1.100",
      lastSeen: "2024-01-15 10:30:00"
    },
    {
      id: 2,
      name: "Endpoint 2",
      type: "Laptop",
      status: "Inactive",
      ipAddress: "192.168.1.101",
      lastSeen: "2024-01-14 15:45:00"
    },
    {
      id: 3,
      name: "Endpoint 3",
      type: "Server",
      status: "Active",
      ipAddress: "192.168.1.102",
      lastSeen: "2024-01-15 09:15:00"
    }
  ];

  useEffect(() => {
    loadEndpoints();
  }, [selectedBranch]);

  const loadEndpoints = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call to fetch endpoints
      // const response = await endpointAPI.getEndpoints({ branchId: selectedBranch });
      // setEndpoints(response.data);

      // For now, using mock data
      setTimeout(() => {
        setEndpoints(mockEndpoints);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error loading endpoints:", err);
      setError("Failed to load endpoints");
      setLoading(false);
    }
  };

  const handleAddEndpoint = () => {
    // TODO: Navigate to add endpoint page
    console.log("Add endpoint clicked");
  };

  const handleViewEndpoint = (endpointId) => {
    // TODO: Navigate to endpoint details page
    console.log("View endpoint:", endpointId);
  };

  const getStatusColor = (status) => {
    return status === "Active" ? "success" : "error";
  };

  if (loading) {
    return <PageLoader text="Loading endpoints..." />;
  }

  if (error) {
    return <ErrorNotification message={error} onRetry={loadEndpoints} />;
  }

  return (
    <div className="endpoints-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Endpoints</h1>
          <p>Manage and monitor your endpoints</p>
        </div>

        {hasPermission("endpoints:page_buttons:add") && (
          <Button
            variant="primary"
            onClick={handleAddEndpoint}
            icon="add"
          >
          Add Endpoint
        </Button>)}
        {hasPermission("endpoints:page_buttons:edit") && (
          <Button
            variant="primary"
            onClick={handleAddEndpoint}
            icon="edit"
          >
          Edit Endpoint
        </Button>)}
      </div>

      <div className="endpoints-summary">
        <Card className="summary-card">
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">{endpoints.length}</span>
              <span className="metric-label">Total Endpoints</span>
            </div>
          </div>
        </Card>

        <Card className="summary-card">
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">
                {endpoints.filter(e => e.status === "Active").length}
              </span>
              <span className="metric-label">Active Endpoints</span>
            </div>
          </div>
        </Card>

        <Card className="summary-card">
          <div className="card-content">
            <div className="metric">
              <span className="metric-value">
                {endpoints.filter(e => e.status === "Inactive").length}
              </span>
              <span className="metric-label">Inactive Endpoints</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="endpoints-list">
        <Card>
          <div className="card-header">
            <h3>Endpoint List</h3>
          </div>
          <div className="card-content">
            {endpoints.length === 0 ? (
              <div className="empty-state">
                <p>No endpoints found</p>
                <Button variant="outline" onClick={handleAddEndpoint}>
                  Add Your First Endpoint
                </Button>
              </div>
            ) : (
              <div className="endpoints-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>IP Address</th>
                      <th>Last Seen</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoints.map((endpoint) => (
                      <tr key={endpoint.id}>
                        <td>{endpoint.name}</td>
                        <td>{endpoint.type}</td>
                        <td>
                          <span className={`status-badge ${getStatusColor(endpoint.status)}`}>
                            {endpoint.status}
                          </span>
                        </td>
                        <td>{endpoint.ipAddress}</td>
                        <td>{endpoint.lastSeen}</td>
                        <td>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEndpoint(endpoint.id)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Endpoints;