
export function LiveStatus({status}){
    let color = "rgb(255,255,255)";
    switch(status){
        case "CONNECTING" : color = "rgb(238, 223, 22)"; break;
        case "SUBSCRIBED" : color = "rgb(22, 238, 112)"; break;
        case "TIMED_OUT" : color = "rgb(247, 12, 12)"; break;
        case "CLOSED" : color = "rgb(247, 12, 12)"; break;
        default : color = "rgb(164, 19, 200)";
    }

    return (
        <div style={{ ...statusStyle, backgroundColor: color }}>{status}</div>
    );
}

const statusStyle = { 
    zIndex: 100,
    bottom: '10px',
    left: '10px',
    position: 'absolute', 
    borderRadius: '12px'
};