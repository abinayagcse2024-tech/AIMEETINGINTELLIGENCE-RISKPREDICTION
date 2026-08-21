import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Info } from 'lucide-react';

export const RiskBadge = ({ riskLevel = 'low', riskScore = 0.15, riskFactors = [], mitigationTip = null, compact = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBadgeConfig = () => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return {
          className: 'badge-high',
          icon: <ShieldAlert size={compact ? 12 : 14} />,
          label: 'HIGH RISK',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)'
        };
      case 'medium':
        return {
          className: 'badge-medium',
          icon: <AlertTriangle size={compact ? 12 : 14} />,
          label: 'MED RISK',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.15)'
        };
      default:
        return {
          className: 'badge-low',
          icon: <CheckCircle size={compact ? 12 : 14} />,
          label: 'LOW RISK',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)'
        };
    }
  };

  const config = getBadgeConfig();
  const percentage = Math.round((riskScore || 0) * 100);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        className={`badge ${config.className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          cursor: 'help',
          fontSize: compact ? '11px' : '12px',
          padding: compact ? '2px 8px' : '4px 10px',
          userSelect: 'none'
        }}
      >
        {config.icon}
        <span>{config.label}</span>
        <span style={{ opacity: 0.85, fontWeight: 700, marginLeft: '2px' }}>
          ({percentage}%)
        </span>
      </div>

      {/* Hover Explainability Popover */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-8px)',
          width: '280px',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          padding: '12px',
          zIndex: 60,
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: config.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ML Risk Factor Breakdown
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Prob: {percentage}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            {riskFactors && riskFactors.length > 0 ? (
              riskFactors.map((factor, idx) => (
                <div key={idx} style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: config.color }}>•</span>
                  <span>{factor}</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard workload and schedule.</span>
            )}
          </div>

          {mitigationTip && (
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', borderLeft: '3px solid #6366f1', padding: '6px 8px', borderRadius: '4px', marginTop: '6px' }}>
              <span style={{ fontSize: '10.5px', color: '#a5b4fc', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                AI Recommendation:
              </span>
              <span style={{ fontSize: '11px', color: '#f8fafc', lineHeight: 1.3 }}>
                {mitigationTip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
