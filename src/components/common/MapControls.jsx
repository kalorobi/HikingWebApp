import "./MapControls.css";
import { Icon } from "../../assets/ikons/MapIcons";

export default function MapControls({zoom, buttons = []}) {
    return (
        <div className="map-controls">
            {buttons.map((button) => (
                <button
                    key={button.id}
                    className="map-control-btn"
                    onClick={button.onClick}
                    title={button.title}
                >
                    <Icon name={button.icon} />
                </button>
            ))}

            {zoom !== undefined && (
                <div className="map-zoom">
                    {zoom.toFixed(1)}
                </div>
            )}
        </div>
    );
}