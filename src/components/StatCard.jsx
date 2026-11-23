import React from 'react';

export function StatCard({ title, value, sub, icon: Icon, badge }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value ?? '—'}</div>
      {(sub || badge) && (
        <div className="stat-card-sub">
          {badge && <span className="badge badge-moss">{badge}</span>}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
