import { Icon } from '../../assets/ikons/MapIcons'
import './LivePlanRouteCard.css';

export default function RouteCard({data, onClick}){
    return (
        <div className="route-card" onClick={() => onClick(data)}>
          <div className='route-card-text'>
            <div className="route-name">#{data.id} {data.plan_name}</div>
              <div className="route-desc">{data.description}</div>
              <div className="route-link">
              {data.link
                ? <a href={data.link} 
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}>link</a>
                : ''}
              </div>
          </div>
          <div className='route-card-icon'>
            <Icon 
            name={data.is_active ? 'eye_I' : 'eye_I_off'} 
            color={data.is_active === true ? 'var(--color-moss)' : 'var(--color-text)'} />
            <Icon name={data.is_ready? 'map': 'map_off'} color={'var(--color-text)'} />
          </div>
        </div>
    );
}