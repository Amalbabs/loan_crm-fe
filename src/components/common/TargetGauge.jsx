import React from 'react';
import { PhoneCall, Award, Flame } from 'lucide-react';

const TargetGauge = ({ employee, compact = false }) => {
  if (!employee) return null;

  const target = employee.dailyTarget || 100;
  const completed = employee.callsCompleted || 0;
  const percentage = Math.min(100, Math.round((completed / target) * 100));
  const remaining = Math.max(0, target - completed);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  if (compact) {
    return (
      <div className="quota-card">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="quota-title">Daily Call Quota</span>
          <span className="quota-pill">
            {completed} / {target}
          </span>
        </div>
        <div className="progress mb-2">
          <div
            className={`progress-bar ${percentage >= 100 ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="d-flex justify-content-between quota-meta">
          <span>{percentage}% done</span>
          <span>{remaining === 0 ? 'Quota achieved' : `${remaining} left today`}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="target-gauge-card">
      <div className="d-flex align-items-center justify-content-between gap-3 position-relative" style={{ zIndex: 1 }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Flame size={15} style={{ color: '#bfd0fb' }} />
            <span className="gauge-caption">Personal Daily Quota</span>
          </div>
          <h4 className="fw-bold mb-1 text-white">
            {completed} <span className="fs-6 fw-normal" style={{ opacity: 0.75 }}>/ {target} calls</span>
          </h4>
          <p className="text-xs mb-3" style={{ opacity: 0.8 }}>
            {remaining === 0
              ? 'Outstanding! Daily 100-call target completed.'
              : `${remaining} calls remaining to hit your daily target.`}
          </p>
          <div className="d-flex flex-wrap gap-2">
            <span className="gauge-chip">
              <PhoneCall size={12} />
              Interested: {employee.interestedCount}
            </span>
            <span className="gauge-chip">
              <Award size={12} />
              Docs in funnel: {employee.docsCollected}
            </span>
          </div>
        </div>

        <div className="gauge-circle-wrap flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={radius} fill="transparent" stroke="rgba(255,255,255,0.18)" strokeWidth="8" />
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="transparent"
              stroke={percentage >= 100 ? '#4ade80' : '#ffffff'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="position-absolute text-center">
            <div className="gauge-number">{percentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetGauge;
