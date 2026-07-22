import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MountainCard from "../components/livePlan/LivePlanMountainCard";
import { useLivePlanMountains } from "../services/query/useLivPlanMountains";
import './LivePlanMobile.css'

export default function LivePlanMobile(){
  const navigate = useNavigate();

  const { data: mountains = [] } = useLivePlanMountains(2);

  function handleCardClick(data) {
    navigate(`/livePlan//${data.mountain}`);
  }

 return (
    <div className="mountain-grid">
      {mountains.map((m) => (
        <MountainCard 
          key={m.mountain} 
          data={m} 
          onClick={handleCardClick} 
        />
      ))}
    </div>
  );
}