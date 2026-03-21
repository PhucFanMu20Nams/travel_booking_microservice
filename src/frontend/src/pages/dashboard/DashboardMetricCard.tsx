import { ReactNode } from 'react';

type DashboardMetricCardProps = {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  icon?: ReactNode;
  accent?: string;
  testId?: string;
};

export const DashboardMetricCard = ({
  label,
  value,
  caption,
  icon,
  accent = '#0f6cbd',
  testId
}: DashboardMetricCardProps) => {
  return (
    <div className="app-surface dashboard-metric-card" data-testid={testId}>
      <div className="dashboard-metric-card__top">
        <div className="dashboard-metric-card__main">
          <span className="dashboard-metric-card__label" style={{ color: accent }}>
            {label}
          </span>
          <strong className="dashboard-metric-card__value">{value}</strong>
        </div>
        {icon && (
          <div className="dashboard-metric-card__icon" style={{ background: `${accent}14`, color: accent }}>
            {icon}
          </div>
        )}
      </div>
      {caption ? <p className="dashboard-metric-card__caption">{caption}</p> : null}
    </div>
  );
};
