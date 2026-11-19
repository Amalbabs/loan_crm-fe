import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileCheck2,
  Building2,
  BadgeCheck,
  Sparkles,
  PhoneCall,
} from 'lucide-react';

const StatusBadge = ({ status, type = 'call' }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  if (type === 'call') {
    if (normalized === 'interested') {
      return (
        <span className="crm-badge status-interested">
          <CheckCircle2 size={13} />
          INTERESTED
        </span>
      );
    }
    if (normalized.includes('callback')) {
      return (
        <span className="crm-badge status-callback">
          <Clock size={13} />
          CALLBACK_SCHEDULED
        </span>
      );
    }
    if (normalized.includes('not_interested') || normalized.includes('not interested')) {
      return (
        <span className="crm-badge status-not-interested">
          <XCircle size={13} />
          NOT_INTERESTED
        </span>
      );
    }
    if (normalized === 'disbursed') {
      return (
        <span className="crm-badge status-disbursed">
          <Sparkles size={13} />
          DISBURSED
        </span>
      );
    }
    return (
      <span className="crm-badge status-pending">
        <AlertCircle size={13} />
        {status}
      </span>
    );
  }

  if (type === 'doc') {
    if (normalized === 'disbursed' || normalized === 'approved') {
      return (
        <span className="crm-badge status-disbursed">
          <Sparkles size={13} />
          {status}
        </span>
      );
    }
    if (normalized === 'sanctioned') {
      return (
        <span className="crm-badge status-sanctioned">
          <BadgeCheck size={13} />
          Sanctioned
        </span>
      );
    }
    if (normalized.includes('verification') || normalized === 'pending') {
      return (
        <span className="crm-badge status-verification">
          <Building2 size={13} />
          {status}
        </span>
      );
    }
    if (normalized.includes('kyc') || normalized === 'uploaded' || normalized === 'verified') {
      return (
        <span className="crm-badge status-kyc">
          <FileCheck2 size={13} />
          {status}
        </span>
      );
    }
    return (
      <span className="crm-badge status-pending">
        <Clock size={13} />
        {status}
      </span>
    );
  }

  // Staff availability / performance status
  if (normalized === 'target_achieved' || normalized === 'available') {
    return (
      <span className="crm-badge status-available">
        <CheckCircle2 size={12} />
        {status}
      </span>
    );
  }
  if (normalized === 'on_track' || normalized === 'on call') {
    return (
      <span className="crm-badge status-oncall">
        <PhoneCall size={12} />
        {status}
      </span>
    );
  }
  if (normalized === 'wrap-up') {
    return (
      <span className="crm-badge status-wrapup">
        <Clock size={12} />
        Wrap-up
      </span>
    );
  }

  return <span className="crm-badge status-pending">{status}</span>;
};

export default StatusBadge;
