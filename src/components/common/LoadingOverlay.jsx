import './LoadingOverlay.css'

export default function LoadingOverlay({ open, text = 'Betöltés...' }) {
    if (!open) return null;
    return (
        <div className='loadingOverlay'>
            <div className='loadingCard'>
                <span className='loadingSpinner' />
                <span>{text}</span>
            </div>
        </div>
    );
}