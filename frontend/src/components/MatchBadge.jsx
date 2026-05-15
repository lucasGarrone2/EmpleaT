import React from 'react';

export default function MatchBadge({ percentage, size = 60 }) {
  const isHighMatch = percentage >= 80;
  const isMediumMatch = percentage >= 50 && percentage < 80;
  
  // Colors matching the original inline styles
  const color = isHighMatch ? '#00d66b' : (isMediumMatch ? '#FFB020' : '#d32f2f');
  
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: size, height: 'auto' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F0F0F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: color
        }}>
          <span style={{ fontSize: `${size * 0.28}px`, fontWeight: '900', margin: 0, lineHeight: 1 }}>{percentage}%</span>
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px', marginTop: '4px', color: color }}>MATCH</div>
    </div>
  );
}
