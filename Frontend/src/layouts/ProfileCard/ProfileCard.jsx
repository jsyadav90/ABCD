/**
 * ProfileCard Component
 * Display user profile info with branch and module selectors
 * Reusable across dashboard instances (Module 1, Module 2, etc.)
 */
import React from "react";
import { Button, Card, Select } from "../../components";
import "./ProfileCard.css";

const ProfileCard = ({
  profile,
  branch,
  setBranch,
  branchOptions,
  selectedAppModule,
  setSelectedAppModule,
  appModuleOptions,
  onApplyFilters,
}) => {
  return (
    <Card className="profile-card" title="">
      <div className="profile-row">
        <div className="user-meta">
          <div className="avatar">
            {profile?.name ? profile.name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() : "U"}
          </div>
          <div>
            <div className="user-name">{profile?.name || "--"}</div>
            <div className="user-role">
              {profile?.role ? profile.role.replaceAll("_", " ").toUpperCase() : "N/A"}
             
            </div>
            <div className="user-id"> ID : {profile?.userId || "--"}</div>
          </div>
        </div>

        <div className="filters">
          <div className="filter">
            <label className="filter-label">Module</label>
            <Select
              name="appModule"
              value={selectedAppModule}
              onChange={(e) => setSelectedAppModule(e.target.value)}
              options={appModuleOptions}
              disabled={appModuleOptions.length <= 1}
              placeholder=""
            />
          </div>
          <div className="filter">
            <label className="filter-label">Branch</label>
            <Select
              name="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              options={
                branchOptions.length > 1
                  ? [{ value: "__ALL__", label: "All Branches" }, ...branchOptions]
                  : branchOptions
              }
              disabled={branchOptions.length === 1}
              placeholder=""
            />
          </div>
          <div className="filter-btn">
            <Button variant="primary" size="md" onClick={onApplyFilters}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileCard;
