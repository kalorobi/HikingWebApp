import { Icon } from '../../assets/ikons/MapIcons'
import './LivePlanMountainCard.css'

export default function MountainCard({data, onClick}){
    function handleClick(e, filter =''){
      e.stopPropagation();
      onClick(data, filter);
    }
    return (
        <div className="mountain-card" onClick={() => onClick(data)}>
          <div className="mountain-name">{data.mountain}</div>
          <div className="mountain-icons">
            <div className="mountain-icon">
              <Icon name='map' /> {data.total_routes}
            </div>
            <div className="mountain-icon">
              {data.ready_routes > 0 
              ? <Icon name='route' onClick={(e) => handleClick(e, 'route')}/> 
              : <Icon name='route_off' />} 
              {data.ready_routes}
            </div>
            <div className="mountain-icon"
              style={{backgroundColor: data.active > 0 ? 'var(--color-moss)' : undefined}}>
              {data.active > 0 
              ? <Icon name='eye_I' onClick={(e) => handleClick(e, 'active')}/> 
              : <Icon name='eye_I_off' />}
              {data.active}</div>
          </div>
        </div>
    )
}