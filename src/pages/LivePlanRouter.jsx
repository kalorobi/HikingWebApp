import LivePlan from './LivePlan'
import LivePlanMobile from "./LivePlanMobile";
import LivePlanMountain from './LivePlanMountain';
import { useParams } from 'react-router-dom';


export default function LivePlanRouter() {
    const isMobile =
        navigator.userAgentData?.mobile ??
        /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

    const { mountain } = useParams();

    return mountain
        ? <LivePlanMountain />
        :  isMobile
            ? <LivePlanMobile />
            : <LivePlan />;
}