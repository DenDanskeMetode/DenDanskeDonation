function CircularProgress({ raised, goal, image, title, size = 220, strokeWidth = 7, onClick }) {
  const pct = Math.min((raised / goal) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="cd-progress-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="cd-ring">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e0e0e0" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#4caf50" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <img
        src={image} alt={title} className="cd-ring-img"
        onClick={onClick}
        style={onClick ? { cursor: 'pointer' } : undefined}
      />
    </div>
  );
}

export default CircularProgress;
