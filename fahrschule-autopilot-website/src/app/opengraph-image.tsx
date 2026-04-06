import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Fahrschule Autopilot — AI-Automation für Fahrschulen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #3b82f6, #10b981)",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#f0f0f5",
            marginBottom: 16,
            display: "flex",
          }}
        >
          Fahrschule{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #3b82f6, #10b981)",
              backgroundClip: "text",
              color: "transparent",
              marginLeft: 16,
            }}
          >
            Autopilot
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#8888a0",
            marginBottom: 48,
          }}
        >
          AI-Automation für deutsche Fahrschulen
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 64,
          }}
        >
          {[
            { value: "35%", label: "weniger No-Shows" },
            { value: "20+", label: "Bewertungen/Monat" },
            { value: "€1.400+", label: "gespart/Monat" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #3b82f6, #10b981)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 16, color: "#8888a0", marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#3b82f6",
          }}
        >
          fahrschulautopilot.de
        </div>
      </div>
    ),
    { ...size }
  );
}
