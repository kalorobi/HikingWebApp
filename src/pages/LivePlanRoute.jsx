import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLivePlanRoutes } from '../services/query/useLivePlanRoutes';
import { Icon } from '../assets/ikons/MapIcons';
import './LivePlanRoute.css';
import PlanCard from '../components/livePlan/LivePlanPlanCard';
import LivePlanLoading from '../components/livePlan/LivePlanLoading';

export default function LivePlanRoute(){

    const { mountain, routeId } = useParams();
    const { data: routes = [], isLoading } = useLivePlanRoutes(mountain);
    const route = routes?.find(r => r.id === Number(routeId));



    if (!route || isLoading) return (<LivePlanLoading />)

    return (
        <div className='plan-page'>
           <PlanCard plan={route} /> 
        </div>
    );
}