import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"
import type { FraudScores } from "../types"

interface ScoreRadarProps {
  scores: FraudScores
}

export function ScoreRadar({ scores }: ScoreRadarProps) {
  const data = [
    {
      metric: "Medical\nLanguage",
      value: Math.round((scores.medical_language ?? 0) * 100),
    },
    {
      metric: "Protocol",
      value: Math.round((scores.protocol_adherence ?? 0) * 100),
    },
    {
      metric: "Linguistic",
      value: Math.round((scores.linguistic_naturalness ?? 0) * 100),
    },
    {
      metric: "Severity",
      value: Math.round((scores.severity_alignment ?? 0) * 100),
    },
  ]

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          margin={{ top: 8, right: 20, bottom: 8, left: 20 }}
        >
          <PolarGrid
            stroke="var(--border)"
            strokeOpacity={0.4}
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{
              fill: "var(--muted-foreground)",
              fontSize: 10,
              fontWeight: 500,
            }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: "var(--primary)", r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
