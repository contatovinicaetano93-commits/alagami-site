import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C1A3D",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((on, i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                background: on ? "#4ADE80" : "transparent",
                borderRadius: 1,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
