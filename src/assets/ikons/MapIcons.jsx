// lucide ikonok haziasitva
const icons = {
    measure: (
        <><path d="M10 15v-3"/><path d="M14 15v-3"/><path d="M18 15v-3"/>
        <path d="M2 8V4"/><path d="M22 6H2"/><path d="M22 8V4"/>
        <path d="M6 15v-3"/><rect x="2" y="12" width="20" height="8" rx="2"/></>
    ),
    mountain: (
        <><path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
        <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/></>
    ),
    locate: (
        <><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/>
        <line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/>
        <circle cx="12" cy="12" r="7"/></>
    ),
    locateFixed: (
        <><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/>
        <line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/>
        <circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></>
    ),
    maplayer: (
        <><path d="M14.106 5.553 a2 2 0 0 0 1.788 0l3.659-1.83
        A1 1 0 0 1 21 4.619v12.764 a1 1 0 0 1-.553.894l-4.553 2.277
        a2 2 0 0 1-1.788 0l-4.212-2.106 a2 2 0 0 0-1.788 0l-3.659 1.83
        A1 1 0 0 1 3 19.381V6.618 a1 1 0 0 1 .553-.894l4.553-2.277 a2 2 0 0 1 1.788 0z"/>
        <path d="M15 5.764v15"/><path d="M9 3.236v15"/></>
    ),
    refress: (
        <><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
        <path d="M16 16h5v5"/><circle cx="12" cy="12" r="1"/></>
    ),
    calendar: (
        <><path d="M8 2v4"/><path d="M16 2v4"/>
        <rect width="18" height="18" x="3" y="4" rx="2"/>
        <path d="M3 10h18"/><path d="M8 14h.01"/>
        <path d="M12 14h.01"/><path d="M16 14h.01"/>
        <path d="M8 18h.01"/><path d="M12 18h.01"/>
        <path d="M16 18h.01"/></>
    ),
    default: ( 
       <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>
    )

};

export function Icon({ name, scale = 1, width = 24, height = 24, color ='#6f4e37', ...rest }) {
  return (
    <svg
      width={width*scale} height={height*scale} viewBox='0 0 24 24'
      fill="none" stroke={color} strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
      {...rest}
    >
        {icons[name]? icons[name] : icons["default"]}
    </svg>
  )
}

