export default function LiveMapLegend(){
    return (
        <div style={{
            position: 'absolute', left: 16, bottom: 16, zIndex: 10,
            backgroundColor: '#ffffffcc', borderRadius: 6, padding: '8px 10px',
            fontSize: 11, color: '#4A2E1F', lineHeight: 1.6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 3, background: '#D4813A', display: 'inline-block' }} />
                Tervezett út
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 3, background: '#5B8FA8', display: 'inline-block' }} />
                Élő útvonal
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 3, background: '#3A8D60', opacity: 0.4, display: 'inline-block' }} />
                Nyers GPS nyom
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#3A8D60', display: 'inline-block'
                }} />
                Aktuális pont
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#D4813A', display: 'inline-block'
                }} />
                Tervezett pont
            </div>
        </div>
    );
}