import { useEffect, useState } from "react";
import "./LivePlanLoading.css";

export default function LivePlanLoading() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="live-plan-loading">
      Loading{".".repeat(dots)}
    </div>
  );
}