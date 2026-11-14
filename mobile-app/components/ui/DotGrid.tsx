import React from "react";
import Svg, { Circle } from "react-native-svg";

export default function DotGrid({
  color = "#FFFFFF",
  opacity = 0.16,
  rows = 16,
  columns = 12,
  spacing = 30,
}: {
  color?: string;
  opacity?: number;
  rows?: number;
  columns?: number;
  spacing?: number;
}) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={{ position: "absolute", top: 0, left: 0 }}
      opacity={opacity}
      pointerEvents="none"
    >
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((__, col) => (
          <Circle
            key={`${row}-${col}`}
            cx={16 + col * spacing}
            cy={16 + row * spacing}
            r={1.4}
            fill={color}
          />
        )),
      )}
    </Svg>
  );
}
