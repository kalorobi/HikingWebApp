import React, { useEffect, useRef, useState } from 'react';
import './LiveNavbar.css';

export default function LiveNavbar({options}){
    function getStatus(status) {
        console.log(status);
        switch (status) {
            case 'SUBSCRIBED': return 'active';
            case 'CONNECTING': return 'warning';
            case 'TIMED_OUT': return 'warning';
            case 'CLOSED': return 'inactive';
            default: return 'inactive';
        }
    }
    return (
    <div className="navbar">
        <button className="menu-btn"><span /><span /><span />
        </button>

        {options.isOk && 
        <>
        <div className="navbar-info">Túrázó: {options.user}</div>
        <div className="navbar-status">
        <div className="status-led" title="Realtime">
            <span className={`led ${getStatus(options.realtime)}`} />
        </div>
        </div>
        </>
        }
    </div>
    );
}