import { useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import MountainCard from "../components/livePlan/LivePlanMountainCard";
import { useLivePlanMountains } from "../services/query/livePlanQuery/useLivPlanMountains";
import { useCurrentLiveUserId } from "../services/query/livePlanQuery/useCurrentLiveUserId";
import './LivePlanMobile.css'
import LivePlanLoading from "../components/livePlan/LivePlanLoading";

export default function LivePlanMobile(){
  const navigate = useNavigate();

  const { data: liveUserId, isLoading: isUserLoading } = useCurrentLiveUserId();
  const { data: mountains = [], isLoading, isSuccess } = useLivePlanMountains(liveUserId);

  function handleCardClick(data, filter ='') {
    if(filter !==''){
      navigate(`/livePlan/${data.mountain}?filter=${filter}`);
    }
    else {
      navigate(`/livePlan/${data.mountain}`);
    }
  }

 const { count, total, ready } = useMemo(() => {
  if (!isSuccess) return { count: 0, total: 0, ready: 0 };

  return mountains.reduce(
    (acc, m) => {
      acc.total += m.total_routes;
      acc.ready += m.ready_routes;
      acc.count += 1;
      return acc;
    },
    { count: 0, total: 0, ready: 0 }
  );
}, [isSuccess, mountains]);

  if(isUserLoading || isLoading) return (<LivePlanLoading />);

  if(!liveUserId) {
    return (
      <div className="mountain-box">
        <p>A fiókod még nincs összekötve túrázó-profillal. Kérj adminisztrátori beállítást.</p>
      </div>
    );
  }

  return (
    <div className="mountain-box">
      <div className="plan-h1">Túra terv lista ({total}/{ready}) </div>
      <div className="mountain-grid">
        {mountains.map((m) => (
          <MountainCard 
            key={m.mountain} 
            data={m} 
            onClick={handleCardClick} 
          />
        ))}
    </div>
    </div>
  );
}