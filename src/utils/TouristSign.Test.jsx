// pages/TouristSignTest.jsx

import { TouristSign } from '../assets/ikons/TouristSign';
import './TouristSignTest.css';


const signs = [
    {
        type: 'maria',
        name: 'Maria',
        color: 'purple'
    },
    {
        type: 'stripe',
        name: 'Sáv',
        color: 'blue',
    },
    {
        type: 'cross',
        name: 'Kereszt',
        color: 'red',
    },
    {
        type: 'triangle',
        name: 'Háromszög',
        color: 'yellow',
    },
    {
        type: 'square',
        name: 'Négyzet',
        color: 'green',
    },
    {
        type: 'circle',
        name: 'Kör',
        color: 'blue',
    },
    {
        type: 'cave',
        name: 'Barlang',
        color: 'red',
    },
    {
        type: 'ruin',
        name: 'Rom',
        color: 'yellow',
    },
    {
        type: 'chapel',
        name: 'Kápolna',
        color: 'blue',
    },
    {
        type: 'monument',
        name: 'Emlékmű',
        color: 'green',
    },
    {
        type: 'stamp',
        name: 'Bélyegző',
        color: 'red',
    },
    {
        type: 'circular',
        name: 'Körtúra',
        color: 'blue',
    },
];


export default function TouristSignTest() {

    return (
        <main className="touristSignTest">

            <header className="touristSignTestHeader">

                <h1>Magyar turistajelzések</h1>

                <p>
                    MTSZ 2024 – geometriai ellenőrzés
                </p>

            </header>


            <section className="touristSignGrid">

                {signs.map(sign => (

                    <article
                        className="touristSignCard"
                        key={sign.type}
                    >

                        <div className="touristSignPreview">

                            <TouristSign
                                type={sign.type}
                                color={sign.color}
                                width={240}
                                height={200}
                                showBase
                            />

                        </div>


                        <div className="touristSignInfo">

                            <strong>
                                {sign.name}
                            </strong>

                            <span>
                                {sign.type}
                            </span>

                        </div>

                    </article>

                ))}

            </section>

        </main>
    );
}