import { useEffect, useRef } from 'react';
import './LivePlan.css';
import { getPlans } from '../services/LivePlanSupabase';
import LivePlanTable from '../components/livePlan/LivePlanTable';

export default function LivePlan(){
    const {planedRoutes} = getPlans(2);
    
    return (
        <div className='planBox'>
            <div className='header'>H E A D E R</div>
            <div className='mainBox'>
                <div className='planMapBox'>M A P</div>
                <div className='viewBox'>
                    <LivePlanTable planedRoutes={planedRoutes} />
                </div>
            </div>
            <div className='footer'>F O O T E R</div>
        </div>
    );
}