import React from 'react';

const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'primary',
  badgeText,
  badgeTone = 'success',
  progressPercent = null,
}) => {
  return (
    <div className="crm-metric-card d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
          <div>
            <div className="metric-label mb-1">{label}</div>
            <div className="metric-value">{value}</div>
          </div>
          {Icon && (
            <div className={`metric-icon-box tone-${tone}`}>
              <Icon size={22} strokeWidth={2.2} />
            </div>
          )}
        </div>

        {progressPercent !== null && (
          <div className="mb-2">
            <div className="progress progress-thin">
              <div
                className={`progress-bar bg-${tone === 'violet' || tone === 'cyan' ? 'primary' : tone}`}
                role="progressbar"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                aria-valuenow={progressPercent}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        )}
      </div>

      <div className="d-flex align-items-center justify-content-between gap-2 mt-1 pt-1">
        {subtext && <span className="metric-subtext">{subtext}</span>}
        {badgeText && (
          <span className={`badge bg-${badgeTone}-subtle text-${badgeTone} fw-semibold rounded-pill px-2 py-1`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;

