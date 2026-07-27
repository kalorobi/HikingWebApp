import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MountainCard from "../components/livePlan/LivePlanMountainCard";
import { useLivePlanMountains } from "../services/query/useLivPlanMountains";
import './LivePlanMobile.css'
import LivePlanLoading from "../components/livePlan/LivePlanLoading";

export default function LivePlanMobile(){
  const navigate = useNavigate();

  const { data: mountains = [], isLoading } = useLivePlanMountains(2);

  if(isLoading) return (<LivePlanLoading />);

  function handleCardClick(data, filter ='') {
    if(filter !==''){
      navigate(`/livePlan/${data.mountain}?filter=${filter}`);
    }
    else {
      navigate(`/livePlan/${data.mountain}`);
    }
  }

 return (
    <div className="mountain-box">
      <div className="plan-h1">Túra terv lista</div>
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