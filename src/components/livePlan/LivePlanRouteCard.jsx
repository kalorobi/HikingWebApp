import { Icon } from '../../assets/ikons/MapIcons';
import './LivePlanRouteCard.css';

export default function RouteCard({data, onClick}){

  return (
    <div className="route-card" onClick={() => onClick(data, null)}>
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
        <div className='route-card-icons'>
          <div className='route-card-icon'>
            <Icon name={data.is_ready? 'map': 'map_off'} />
          </div>
          <div className='route-card-icon'
            onClick={data.is_ready 
              ? (e) => {
                e.stopPropagation();
                onClick(data, 'set_active');
              }
              : undefined}
            style={{
              backgroundColor: data.is_active ? 'var(--color-moss)' : undefined,
              opacity: data.is_ready ? 1 : 0.4,
              cursor: data.is_ready ? 'pointer' : 'not-allowed'
            }}
          >
            <Icon name={data.is_active ? 'eye_I' : 'eye_I_off'} />
          </div>
        </div>
      </div>
  );
}