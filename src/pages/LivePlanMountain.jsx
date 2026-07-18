import { useParams } from 'react-router-dom';

export default function LivePlanMountain(){
    const { mountain } = useParams();

    return (
        <div>MOUNTAIN: {mountain}</div>
    );
}