import { useEffect, useRef, useState } from 'react';
import styles from './LivePlan.module.css'

import { getPlans } from '../services/supabase/LivePlanSupabase';
import LivePlanTable from '../components/livePlan/LivePlanTable';
import LivePlanMap from '../components/livePlan/LivePlanMap';
import { planMap } from '../components/livePlan/LivePlanHelper';
import LivePlanViewer from '../components/livePlan/LivePlanViewer';

export default function LivePlan(){
    const {planedRoutes} = getPlans(2);
    const [plans, setPlans] = useState(null);
    const [selectedPlan, setSelectePlan] = useState(null);

    useEffect(() => {
        if(!planedRoutes) return;
        const temp = planMap({planedRoutes});

        setPlans(temp);
    },[planedRoutes])
    
    return (
        <div className={styles.planBox}>
            <div className={styles.header}>H E A D E R</div>
            <div className={styles.mainBox}>
                <div className={styles.mapBox}>
                    {plans? <LivePlanMap plans={plans} setSelectedPlan={setSelectePlan}/>: "Loading..."}
                </div>
                <div className={styles.viewBox}>
                    <LivePlanTable planedRoutes={planedRoutes} />
                    <LivePlanViewer selectedPlan={selectedPlan} />
                </div>
            </div>
            <div className={styles.footer}>F O O T E R</div>
        </div>
    );
}