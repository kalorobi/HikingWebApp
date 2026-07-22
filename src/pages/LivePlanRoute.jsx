import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLivePlanRoutes } from '../services/query/useLivePlanRoutes';

export default function LivePlanRoute(){

    const { mountain, routeId } = useParams();

    const { data: routes = [] } = useLivePlanRoutes(mountain);
    const route = routes.find(r => r.id === Number(routeId));

    return (
        <div>Route</div>
    );
}