import { AgentStats } from '@/types';

interface RadarChartProps {
  stats: AgentStats;
  size?: number;
}

export default function RadarChart({ stats, size = 200 }: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.35;

  // 三个方向的角度（120度间隔）
  const angles = [
    -90,  // 顶部 - 代码力
    150,  // 左下 - 知识力
    30,   // 右下 - 创意力
  ];

  // 将角度转换为弧度
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // 计算点的位置
  const getPoint = (angle: number, value: number) => {
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(toRad(angle)),
      y: center + r * Math.sin(toRad(angle)),
    };
  };

  // 数据点
  const points = [
    getPoint(angles[0], stats.coding),
    getPoint(angles[1], stats.knowledge),
    getPoint(angles[2], stats.creativity),
  ];

  // 生成路径
  const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';

  // 背景网格点
  const gridLevels = [25, 50, 75, 100];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        {/* 背景网格 */}
        {gridLevels.map((level) => {
          const gridPoints = angles.map((angle) => getPoint(angle, level));
          const gridPath = gridPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';
          return (
            <path
              key={level}
              d={gridPath}
              fill="none"
              stroke="var(--claw-gray-light)"
              strokeWidth="1"
              opacity={0.5}
            />
          );
        })}

        {/* 轴线 */}
        {angles.map((angle, i) => {
          const endPoint = getPoint(angle, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="var(--claw-gray-light)"
              strokeWidth="1"
              opacity={0.5}
            />
          );
        })}

        {/* 数据区域 */}
        <path
          d={pathData}
          fill="rgba(220, 38, 38, 0.3)"
          stroke="var(--claw-red)"
          strokeWidth="2"
        />

        {/* 数据点 */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="var(--claw-red)"
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* 标签 */}
      <div
        className="absolute text-sm font-medium text-blue-400"
        style={{ 
          top: 0, 
          left: '50%', 
          transform: 'translate(-50%, -100%)',
          marginTop: '-8px'
        }}
      >
        代码力 {stats.coding}
      </div>
      <div
        className="absolute text-sm font-medium text-purple-400"
        style={{ 
          bottom: 0, 
          left: 0, 
          transform: 'translate(-20%, 80%)'
        }}
      >
        知识力 {stats.knowledge}
      </div>
      <div
        className="absolute text-sm font-medium text-pink-400"
        style={{ 
          bottom: 0, 
          right: 0, 
          transform: 'translate(20%, 80%)'
        }}
      >
        创意力 {stats.creativity}
      </div>
    </div>
  );
}
