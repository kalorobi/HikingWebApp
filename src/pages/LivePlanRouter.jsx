import LivePlan from './LivePlan'
import LivePlanMobile from "./LivePlanMobile";
import LivePlanMountain from './LivePlanMountain';
import LivePlanRoute from './LivePlanRoute';
import { useParams } from 'react-router-dom';
import LivePlanQueryProvider from '../services/query/LivePlanQueryProvider';


export default function LivePlanRouter() {
    const isMobile =
        navigator.userAgentData?.mobile ??
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

    const { mountain, routeId } = useParams();

    // Csak a sima LivePlan marad provider nélkül
    if (!isMobile) {
        return <LivePlan />;
    }

    // Minden más React Query-t használ
    return (
        <LivePlanQueryProvider>
            {routeId ? (
                <LivePlanRoute />
            ) : mountain ? (
                <LivePlanMountain />
            ) : (
                <LivePlanMobile />
            )}
        </LivePlanQueryProvider>
    );
}

/*
export default function LivePlanRouter() {
    const isMobile =
        navigator.userAgentData?.mobile ??
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

    const { mountain, routeId } = useParams(); 

    if (routeId) return <LivePlanRoute />;
    if (mountain) return <LivePlanMountain />;
    if (isMobile) return <LivePlanMobile />;
    return <LivePlan />;
}
*/