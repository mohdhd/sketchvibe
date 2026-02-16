import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

// Theme-aware default colors
const CHART_COLORS = [
    'rgba(99, 102, 241, 0.8)',   // indigo
    'rgba(34, 197, 94, 0.8)',    // green
    'rgba(245, 158, 11, 0.8)',   // amber
    'rgba(239, 68, 68, 0.8)',    // red
    'rgba(56, 189, 248, 0.8)',   // sky
    'rgba(168, 85, 247, 0.8)',   // purple
    'rgba(236, 72, 153, 0.8)',   // pink
    'rgba(20, 184, 166, 0.8)',   // teal
];

interface ChartBlockProps {
    config: string;
}

export default function ChartBlock({ config }: ChartBlockProps) {
    const chartConfig = useMemo(() => {
        try {
            const parsed = JSON.parse(config);

            // Apply theme colors if not specified
            if (parsed.data?.datasets) {
                parsed.data.datasets = parsed.data.datasets.map((ds: Record<string, unknown>, i: number) => ({
                    ...ds,
                    backgroundColor: ds.backgroundColor || (
                        parsed.type === 'pie' || parsed.type === 'doughnut'
                            ? CHART_COLORS
                            : CHART_COLORS[i % CHART_COLORS.length]
                    ),
                    borderColor: ds.borderColor || CHART_COLORS[i % CHART_COLORS.length],
                    borderWidth: ds.borderWidth ?? 2,
                }));
            }

            return parsed;
        } catch {
            return null;
        }
    }, [config]);

    if (!chartConfig) {
        return (
            <div className="my-3 p-4 rounded-lg border border-error/30 bg-error-muted text-sm text-error">
                ⚠️ Invalid chart configuration
            </div>
        );
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#8888a0',
                    font: { family: 'Inter', size: isMobile ? 10 : 12 },
                    boxWidth: isMobile ? 8 : 40,
                    boxHeight: isMobile ? 8 : 12,
                    padding: isMobile ? 6 : 10,
                    usePointStyle: isMobile,
                },
            },
            tooltip: {
                backgroundColor: '#1a1a26',
                titleColor: '#e8e8ed',
                bodyColor: '#8888a0',
                borderColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
            },
        },
        scales: chartConfig.type !== 'pie' && chartConfig.type !== 'doughnut' ? {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#555570', font: { family: 'Inter', size: isMobile ? 10 : 11 } },
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#555570', font: { family: 'Inter', size: isMobile ? 10 : 11 } },
            },
        } : undefined,
        ...chartConfig.options,
    };

    const ChartComponent = (() => {
        switch (chartConfig.type) {
            case 'bar':
                return Bar;
            case 'line':
            case 'area':
                return Line;
            case 'pie':
                return Pie;
            case 'doughnut':
            case 'donut':
                return Doughnut;
            default:
                return Bar;
        }
    })();

    // For area charts, add fill
    const data = { ...chartConfig.data };
    if (chartConfig.type === 'area' && data.datasets) {
        data.datasets = data.datasets.map((ds: Record<string, unknown>) => ({ ...ds, fill: true }));
    }

    return (
        <div className="my-3 p-4 rounded-lg border border-border bg-bg-surface">
            <div style={{ position: 'relative', width: '100%', minHeight: '280px' }}>
                <ChartComponent data={data} options={defaultOptions} />
            </div>
        </div>
    );
}
