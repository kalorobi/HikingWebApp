import LivePlan from './LivePlan'
import LivePlanMobile from "./LivePlanMobile";
import LivePlanMountain from './LivePlanMountain';
import LivePlanRoute from './LivePlanRoute';
import { useParams } from 'react-router-dom';
import LivePlanQueryProvider from '../services/query/livePlanQuery/LivePlanQueryProvider';


export default function LivePlanRouter() {
    const isMobile =
        navigator.userAgentData?.mobile ??
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

    const { mountain, routeId } = useParams();

    // Mind a desktop, mind a mobil ág React Query-t használ (pl. a bejelentkezett
    // userhez tartozó live_users.user_id lekéréséhez), ezért a providert az
    // egész router fölé emeljük, nem csak a mobil ágra.
    return (
        <LivePlanQueryProvider>
            {!isMobile ? (
                <LivePlan />
            ) : routeId ? (
                <LivePlanRoute />
            ) : mountain ? (
                <LivePlanMountain />
            ) : (
                <LivePlanMobile />
            )}
        </LivePlanQueryProvider>
    );
}