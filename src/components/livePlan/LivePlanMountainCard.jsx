import { Icon } from '../../assets/ikons/MapIcons'
import './LivePlanMountainCard.css'

export default function MountainCard({data, onClick}){
    return (
        <div className="mountain-card" onClick={() => onClick(data)}>
          <div className="mountain-name">{data.mountain}</div>
          <div className="mountain-stats">
            <span className="stat total"><Icon name='map' /> {data.total_routes}</span>
            <span className="stat ready"><Icon name='route' /> {data.ready_routes}</span>
            <span className={`stat active ${data.active > 0 ? ' on' : ''}`}><Icon name='eye' /> {data.active}</span>
          </div>
        </div>
    )
}