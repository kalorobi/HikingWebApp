import './LiveStatus.css';

export function LiveStatus({status}){
    let color = "rgb(255,255,255)";
    switch(status){
        case "CONNECTING" : color = "#D4813A"; break;
        case "SUBSCRIBED" : color = "#3A8D60"; break;
        case "TIMED_OUT" : color = "#D4813A"; break;
        case "CLOSED" : color = "rgb(247, 12, 12)"; break;
        default : color = "rgb(164, 19, 200)";
    }

    return (
        <div className="statusDisplay" style={{ backgroundColor: color }}>{status}</div>
    );
}