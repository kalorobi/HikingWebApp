import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { MountainSummary } from "../services/supabase/LivePlanMobileSupabase";
import MountainCard from "../components/livePlan/LivePlanMountainCard";

import './LivePlanMobile.css'

export default function LivePlanMobile(){
  const navigate = useNavigate();
  const [mountains, setMountains] = useState([]);

  useEffect(() => {
      async function load() {
          const m = await MountainSummary(2);
          setMountains(m);
      }

      load();

  },[]);

  function handleCardClick(data) {
    console.log(data);
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