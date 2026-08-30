const COLORS = {
    blue: '#0057B8',
    red: '#D00000',
    yellow: '#F2C500',
    green: '#00843D',
    purple: '#7A3E9D',
    black: '#000000',
};

const signs = {

    // 1. Sáv
    stripe: (
        <rect
            x="0"
            y="33"
            width="120"
            height="34"
        />
    ),

    // 2. Kereszt
    cross: (
        <path d="
            M 50 15
            H 70
            V 40
            H 95
            V 60
            H 70
            V 85
            H 50
            V 60
            H 25
            V 40
            H 50
            Z
        " />
    ),

    // 3. Háromszög
    triangle: (
        <polygon points="
            60,15
            100,85
            20,85
        " />
    ),

    // 4. Négyzet
    square: (
        <rect
            x="25"
            y="15"
            width="70"
            height="70"
        />
    ),

    // 5. Kör
    circle: (
        <circle
            cx="60"
            cy="50"
            r="35"
        />
    ),

    // 6. Barlang
    cave: (
        <path d="
            M 15 70
            H 30
            V 50
            A 30 30 0 0 1 90 50
            V 70
            H 105
            V 85
            H 75
            V 50
            A 15 15 0 0 0 45 50
            V 85
            H 15
            Z
        " />
    ),

    // 7. Rom
    ruin: (
        <path d="
            M 25 15
            H 45
            V 65
            H 95
            V 85
            H 25
            Z
        " />
    ),

    // 8. Kápolna
    chapel: (
        <path d="
            M 52 15
            H 68
            V 30
            H 83
            V 45
            H 68
            V 60
            L 90 85
            H 30
            L 52 60
            V 45
            H 37
            V 30
            H 52
            Z
        " />
    ),

    // 9. Emlékmű
    monument: (
        <path d="
            M 25 70
            H 40
            V 35
            A 20 20 0 0 1 80 35
            V 70
            H 95
            V 85
            H 25
            Z
        " />
    ),

    // 10. Bélyegző
    stamp: (
        <path d="
            M 30 70
            H 52
            V 39
            A 12 12 0 1 1 68 39
            V 70
            H 90
            V 85
            H 30
            Z
        " />
    ),

    // 11. Körtúra
    circular: (
        <path d="
            M 25 50
            A 35 35 0 1 1 60 85
            L 60 70
            A 20 20 0 1 0 40 50
            L 32.5 57.5
            Z
        " />
    ),
maria: (
    <>
       <path d="M 10 90 V 35 A 25 25 0 0 1 60 35
            V 90 H 45 V 35 A 10 10 0 0 0 25 35 V 90 Z
        "/>
        <path d="M 45 35 A 25 25 0 0 1 95 35 V 72.5
            A 7.5 7.5 0 0 0 102.5 80 V 90 H 88.5 A 7.5 7.5 0 0 1 80 82.5
            V 35 A 10 10 0 0 0 60 35 Z
        "/>
        <path d="M 35 50 H 70 V 65 H 35 Z"/>
    </>
),
    empty : (
        <path d="
            M 25 50
        " />
    ),
};


export function TouristSign({
    type,
    color = 'blue',
    scale = 1,
    width = 120,
    height = 100,
    showBase = true,
    className,
    ...rest
}) {

    const sign = signs[type] ?? signs['empty'];

    if (!sign) {
        return null;
    }

    return (
        <svg
            width={width * scale}
            height={height * scale}
            viewBox="0 0 120 100"
            className={className}
            {...rest}
        >

            {showBase && (
                <rect
                    x="0"
                    y="0"
                    width="120"
                    height="100"
                    fill="#ffffff"
                />
            )}

            <g fill={COLORS[color] ?? color}>
                {sign}
            </g>

        </svg>
    );
}

export const TOURIST_SIGNS = {

    // Kék
    k:  { type: 'stripe',   color: 'blue' },
    kb: { type: 'cave',     color: 'blue' },
    kl: { type: 'ruin',     color: 'blue' },
    k3: { type: 'triangle', color: 'blue' },
    k4: { type: 'square',   color: 'blue' },
    'k+': { type: 'cross',    color: 'blue' },
    kq: { type: 'circle',   color: 'blue' },
    kc: { type: 'circular',   color: 'blue' },

    // Piros
    p:  { type: 'stripe',   color: 'red' },
    pb: { type: 'cave',     color: 'red' },
    pl: { type: 'ruin',     color: 'red' },
    p3: { type: 'triangle', color: 'red' },
    p4: { type: 'square',   color: 'red' },
    'p+': { type: 'cross',    color: 'red' },
    pq: { type: 'circle',   color: 'red' },
    pc: { type: 'circular',   color: 'red' },

    // Sárga
    s:  { type: 'stripe',   color: 'yellow' },
    sb: { type: 'cave',     color: 'yellow' },
    sl: { type: 'ruin',     color: 'yellow' },
    s3: { type: 'triangle', color: 'yellow' },
    s4: { type: 'square',   color: 'yellow' },
    's+': { type: 'cross',    color: 'yellow' },
    sq: { type: 'circle',   color: 'yellow' },
    sc: { type: 'circular',   color: 'yellow' },

    // Zöld
    z:  { type: 'stripe',   color: 'green' },
    zb: { type: 'cave',     color: 'green' },
    zl: { type: 'ruin',     color: 'green' },
    z3: { type: 'triangle', color: 'green' },
    z4: { type: 'square',   color: 'green' },
    'z+': { type: 'cross',    color: 'green' },
    zq: { type: 'circle',   color: 'green' },
    zc: { type: 'circular',   color: 'green' },

    //Mária
    lm: { type: 'maria', color: 'purple'},

    empty: {type: 'empty', color: 'blue'}
};