import { useEffect, useRef, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './LivePlan.css'
import { fetchAllPlannedRoutes } from '../services/supabase/fetchAllPlannedRoutes';
import LivePlanTable from '../components/livePlan/LivePlanTable';
import LivePlanMap from '../components/livePlan/LivePlanMap';
import LivePlanViewer from '../components/livePlan/LivePlanViewer';
import { useCurrentLiveUserId } from '../services/query/livePlanQuery/useCurrentLiveUserId';
import { useAuth } from '../services/auth/AuthContext';
import { Icon } from '../assets/ikons/MapIcons';
import logger from '../utils/Logger';

const log = logger.scope('LivePlan');

export default function LivePlan(){
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const [plans, setPlans] = useState([]);
    const { data: liveUserId, isLoading: isUserLoading } = useCurrentLiveUserId();

    const [selectedPlan, setSelectedPlan] = useState(null);

    useEffect(() => {
        if (isUserLoading || !liveUserId) return;

        async function load() {
            const temp = await fetchAllPlannedRoutes(liveUserId);
            if(temp) setPlans(temp);
        }
        load();
    },[liveUserId, isUserLoading]);

    useEffect(() => {
        log.debug('plans', plans);
    },[plans]);

    async function handleLogout() {
        await signOut();
        navigate('/login', { replace: true });
    }

    return (
        <div className='planBox'>
            <div className='header'>
                <span>H E A D E R</span>
                <button
                    type="button"
                    className="header-logout-btn"
                    onClick={handleLogout}
                    title="Kijelentkezés"
                >
                    <Icon name="logout" color="var(--color-text)" />
                </button>
            </div>
            <div className='planMainBox'>
                <div className='planMapBox'>
                    <LivePlanMap plans={plans} selectedPlan={selectedPlan} />
                </div>
                <div className='planViewBox'>
                    <LivePlanTable 
                        planedRoutes={plans}
                        setSelectedPlan={setSelectedPlan}
                    />
                </div>
            </div>
            <div className='footer'>F O O T E R</div>
        </div>
    );
}