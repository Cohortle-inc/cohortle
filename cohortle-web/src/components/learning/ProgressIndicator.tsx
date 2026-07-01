'use client';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ProgressIndicator({
  current,
  total,
  label,
  size = 'medium',
}: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const sizeClasses = {
    small: {
      container: 'text-xs',
      bar: 'h-1.5',
      text: 'text-xs',
    },
    medium: {
      container: 'text-sm',
      bar: 'h-2',
      text: 'text-sm',
    },
    large: {
      container: 'text-base',
      bar: 'h-3',
      text: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={classes.container}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">{label}</span>
          <span className={`${classes.text} text-gray-600`}>
            {current} / {total}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`${classes.bar} bg-blue-600 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label || 'Progress'}
          />
        </div>

        {!label && (
          <span className={`${classes.text} font-medium text-gray-700 min-w-[3rem] text-right`}>
            {percentage}%
          </span>
        )}
      </div>

      {label && (
        <div className="mt-1 text-right">
          <span className={`${classes.text} font-semibold text-blue-600`}>{percentage}%</span>
        </div>
      )}
    </div>
  );
}
