export default function LivePlanViewer({selectedPlan}){
    if(selectedPlan === null) return;

    return (
        <>
            <div>id: {selectedPlan.data.id}</div>
            <div>Terv neve: 
                <input 
                    type="text"
                    disabled={true}
                    value={selectedPlan.data.plan_name}/>
            </div>
        </>

    );
    
}