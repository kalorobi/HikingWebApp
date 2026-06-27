import { Tooltip } from 'react-tooltip';
import LiveView from './LiveView'
import { Icon } from '../../assets/ikons/MapIcons';
import './LiveFooter.css';


export default function LiveFooter(){


    function calcUp(coordinates){
        if(!coordinates) return 0;
        let up = 0;

        coordinates.forEach((coord, i, coords) => {
            if(i !== 0) {
                if(coords[i][2] > coords[i-1][2]){
                    up += coords[i][2] - coords[i-1][2];
                }
            }
        })
        return up.toFixed(0);
    }
    return (
        <>
        <div className='stat'>
            <Icon name="measure" color="#F2E7D5" scale={0.8}/>
            <span> km</span>
        </div>
        <div className='stat'>
            <Icon name="mountain" color="#F2E7D5" scale={0.8}/>
            <span> m</span>
        </div>
        <div className='stat'>
            <Icon name="eye" color="#F2E7D5" scale={0.8}/>
            <span> <LiveView /> </span>
        </div>
        </>
    );
}