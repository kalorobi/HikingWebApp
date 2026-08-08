import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import RouteCard from '../components/livePlan/LivePlanRouteCard';
import { useLivePlanRoutes } from '../services/query/livePlanQuery/useLivePlanRoutes';
import { useUpdateLivePlanRoute } from '../services/query/livePlanQuery/useLivePlanMutation';
import './LivePlanMountain.css';
import ConfirmDialog from '../components/general/ConfirmDialog';
import LivePlanLoading from '../components/livePlan/LivePlanLoading';
import { Icon } from '../assets/ikons/MapIcons';

export default function LivePlanMountain(){
    const { mountain } = useParams();
    const [searchParams] = useSearchParams();
    const filter = searchParams.get('filter');
    const navigate = useNavigate();
    const [confirmRoute, setConfirmRoute] = useState(null);

    const { data: routes = [], isLoading } = useLivePlanRoutes(mountain);
    const { mutate: updateRoute, isPending: isUpdating } = useUpdateLivePlanRoute();

    if(isLoading) return (<LivePlanLoading />);
    if(isUpdating) return (<div>UPDATE...</div>);

    function handleRouteClick(data, action) {
        if (!action) {
            navigate(`/livePlan/${data.mountain}/${data.id}`);
            return;
        }

        switch (action) {
            case 'set_active':
                setConfirmRoute(data);
                break;
        }
    }
    function confirmAction() {
        if (!confirmRoute) return;

        updateRoute({
            id: confirmRoute.id,
            user_id: confirmRoute.user_id,
            mountain,
            is_active: !confirmRoute.is_active
        });

        setConfirmRoute(null);
    }

    const filteredRoutes = routes.filter((route) => {
        if (filter === 'route') {return route.is_ready === true;}
        if (filter === 'active') {return route.is_active === true;}
        return true;
    });

    return (
        <div className='route-list-box'>
            <div className='route-head'>
                <div className='route-back' onClick={() => navigate(-1)}>
                    <Icon name='back' color='var(--color-text)' />
                </div>
                <div className='route-h1'>
                    {mountain} túratervek
                </div>
            </div>
            <div className='route-list'>
                {filteredRoutes.map((route) => (
                    <RouteCard
                        key={route.id}
                        data={route}
                        onClick={handleRouteClick}
                    />
                ))}
            </div>

            <ConfirmDialog
            open={!!confirmRoute}
            title="Megerősítés"
            text={
                confirmRoute?.is_active
                    ? "Biztosan kikapcsolod ezt az útvonalat?"
                    : "Biztosan aktiválod ezt az útvonalat?"
            }
            onCancel={() => setConfirmRoute(null)}
            onConfirm={confirmAction}
            />


        </div>
    );
}