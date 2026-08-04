import { useState } from 'react'
import './LivePlanTable.css'

function AddRow({ plan, isExpanded, onRowClick }) {
    return (
        <>
            <tr onClick={() => onRowClick(plan)}>
                <td>{plan.id}</td><td>{plan.plan_name}</td><td>{plan.mountain}</td>
                <td>{plan.distance}km</td>
                <td className={plan.is_ready ? 'plan_td_active' :''}>{plan.is_ready? 'x' : '-'}</td>
                <td className={plan.is_active ? 'plan_td_active' :''}>{plan.is_active? 'x' : '-'}</td>
            </tr>
            {isExpanded && (
                <tr className='plan_expanded_row'>
                    <td colSpan={6}>
                        <div className='plan-details'>
                            <p><strong>Leírás:</strong> {plan.description}</p>
                            <p><strong>link:</strong> {plan.link}</p>
                            {/* stb. */}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function LivePlanTable({planedRoutes, setSelectedPlan}) {
    const [expandedId, setExpandedId] = useState(null);

    if(!planedRoutes) return null;

    function handleRowClick(plan) {
        setExpandedId(prevId => prevId === plan.id ? null : plan.id);
        setSelectedPlan(plan);
    }

    return (
        <table className='plan_table'>
            <thead>
            <tr>
                <th>id</th><th>Név</th><th>hegy</th><th>km</th><th>R</th><th>A</th>
            </tr>
            </thead>
            <tbody>
                {planedRoutes.map((plan) => (
                    <AddRow
                        key={plan.id}
                        plan={plan}
                        isExpanded={expandedId === plan.id}
                        onRowClick={handleRowClick}
                    />
                ))}
            </tbody>
        </table>
    )
}