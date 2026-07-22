import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RouteCard from '../components/livePlan/LivePlanRouteCard';
import { useLivePlanRoutes } from '../services/query/useLivePlanRoutes';
import './LivePlanMountain.css'

export default function LivePlanMountain(){
    const { mountain } = useParams();
    const navigate = useNavigate();

    const { data: routes = [] } = useLivePlanRoutes(mountain);

    function handleRouteClick(data){
        navigate(`/livePlan//${data.mountain}//${data.id}`);
    }

    return (
        <div className='route-list'>
            {routes?.map((route) => (
                <RouteCard key={route.id} data={route} onClick={handleRouteClick}/>
                
            ))}
        </div>
    );
}