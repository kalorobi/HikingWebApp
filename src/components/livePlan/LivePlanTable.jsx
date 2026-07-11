import { useState } from 'react'
import './LivePlanTable.css'

export default function LivePlanTable({planedRoutes}) {
    const [expandedId, setExpandedId] = useState(null);

    if(!planedRoutes) return null;

    function handleRowClick(plan) {
        setExpandedId(prevId => prevId === plan.id ? null : plan.id);
    }

    function AddRow({plan, isExpanded, onRowClick}){
        return (
            <>
                <tr onClick={() => onRowClick(plan)}>
                    <td>{plan.id}</td><td>{plan.plan_name}</td><td>{plan.mountain}</td>
                    <td className={plan.is_ready?'td-active':''}>{plan.is_ready? 'x' : '-'}</td>
                    <td className={plan.is_active?'td-active':''}>{plan.is_active? 'x' : '-'}</td>
                </tr>
                {isExpanded && (
                    <tr className="expanded-row">
                        <td colSpan={5}>
                            <div className="plan-details">
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

    return (
        <table className='planTable'>
            <thead>
            <tr>
                <th>id</th><th>Név</th><th>hegy</th><td>R</td><td>A</td>
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