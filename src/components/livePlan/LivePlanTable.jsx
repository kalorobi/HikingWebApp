import { useState } from 'react'
import styles from './LivePlanTable.module.css'

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
                    <td>{plan.distance}km</td>
                    <td className={plan.is_ready?styles.td_active:''}>{plan.is_ready? 'x' : '-'}</td>
                    <td className={plan.is_active?styles.td_active:''}>{plan.is_active? 'x' : '-'}</td>
                </tr>
                {isExpanded && (
                    <tr className={styles.expanded_row}>
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