import { Tooltip } from 'react-tooltip';

export default function MapMarker({ id, text =" - ", color = "#6f4e37", onClick }) {
    return (
        <div
            data-tooltip-id="map-tooltip"
            data-tooltip-content={`${id} - ${text}`}
            onClick={onClick}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
            }}
        >
            <div
                style={{
                    minWidth: 24,
                    height: 24,
                    padding: "0 4px",
                    borderRadius: 4,
                    background: color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    border: `2px solid ${color}`,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                    whiteSpace: "nowrap",
                }}
            >
                {id}
            </div>

            {/* keretes V */}
            <div
                style={{
                    position: "relative",
                    width: 0,
                    height: 0,
                    marginTop: -1,
                }}
            >
                {/* külső keret */}
                <div
                    style={{
                        position: "absolute",
                        left: -8,
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: `10px solid ${color}`,
                    }}
                />

                {/* belső kitöltés */}
                <div
                    style={{
                        position: "absolute",
                        left: -6,
                        top: -2,
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: `8px solid ${color}`,
                    }}
                />
            </div>

        </div>
    );
}