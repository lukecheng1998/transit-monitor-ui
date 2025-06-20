import "./globals.css";
import transitData from "./json-files/sf_muni.json"
import transitData2 from "./json-files/bart.json"
import transitData3 from "./json-files/caltrain.json"

type Arrival = {
    line: string,
    destination: string,
    arrival_time: number[];
}
type Departure = {
    line: string,
    destination: string,
    departure_time: number[];
}
type SFMuniSchedule = Arrival[][];
const muniData: SFMuniSchedule = transitData;

type bartSchedule = Arrival[][];
const bartData: bartSchedule = transitData2;

type caltrainSchedule = Departure[][];
const caltrainData: caltrainSchedule = transitData3;

export default function Home() {
    return (
        <div className="justify-items-center">
            <main className="justify-items-center">
                <h1>This is a test</h1>
                <h2>MUNI</h2>
                {muniData.map((direction, dirIdx)=> (
                    <div key={dirIdx} className="my-4">
                        <h3 className="font-semibold">Direction {dirIdx === 0 ? 'Transit Center': 'Northbound'}
                            <ul className="list-disc list-inside">
                                {direction.map((train, i)=> (
                                    <li key={i}>
                                        <strong>{train.line}</strong> to {train.destination} - arrives in {train.arrival_time.join(" min, ")} min
                                    </li>
                                ))}
                            </ul>
                        </h3>
                    </div>
                ))}
                <h2>BART</h2>
                {bartData.map((direction, dirIdx) => (
                    <div key={dirIdx} className="my-4">
                        <h3 className="font-semibold">Direction {dirIdx === 0 ? 'Soundbound' : 'Northbound'}
                            <ul className="list disc list-inside">
                                {direction.map((train, i) => (
                                    <li key={i}>
                                        <strong>{train.line}</strong> to {train.destination} - arrives in {train.arrival_time.join(" min, ")} min
                                    </li>
                                ))}
                            </ul>
                        </h3>
                    </div>
                ))}
                <h2>CALTRAIN</h2>
                {caltrainData.map((direction, dirIdx) => (
                    <div key={dirIdx} className="my-4">
                        <h3 className= "font-semibold">Direction Southbound
                            <ul className="list idsc list-inside">
                                {direction.map((train, i)=> (
                                    <li key={i}>
                                        <strong>{train.line}</strong> to {train.destination} - departs in {train.departure_time.join(" min, ")} min
                                    </li>
                                ))}
                            </ul>
                        </h3>

                    </div>
                ))}
            </main>
        </div>
    )
}
