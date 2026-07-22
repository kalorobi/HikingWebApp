import { useEffect, useRef, useState} from 'react';
import './LivePlan.css'
import { AllRoutes } from '../services/supabase/LivePlanSupabase';
import LivePlanTable from '../components/livePlan/LivePlanTable';
import LivePlanMap from '../components/livePlan/LivePlanMap';
import LivePlanViewer from '../components/livePlan/LivePlanViewer';



export default function LivePlan(){
    const [plans, setPlans] = useState([]);

    const [selectedPlan, setSelectePlan] = useState(null);

    useEffect(() => {
        async function load() {
            const temp = await AllRoutes(2);
            if(temp) setPlans(temp);
        }
        load();
    },[]);
    
    useEffect(() => {
        console.log(plans);
        
    },[plans]);
    
    return (
        <div className='planBox'>
            <div className='header'>H E A D E R </div>
            <div className='planMainBox'>
                <div className='planMapBox'>
                    <LivePlanMap plans={plans} setSelectedPlan={setSelectePlan} />
                </div>
                <div className='planViewBox'>
                    T A B L E
                </div>
            </div>
            <div className='footer'>F O O T E R</div>
        </div>
    );
}