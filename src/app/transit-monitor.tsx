import React, { useState, useEffect, use } from 'react';
import { TransitArrival } from './assets/types';

const S3_BUCKET_URL = 'https://your-bucket-name.s3.amazonaws.com/'; // TODO: Fill in with actual S3 bucket URL

export const TransitMonitor: React.FC = () => {
    //Array of arrivals
    const [arrivals, setArrivals] = useState<TransitArrival[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(S3_BUCKET_URL)
            .then(res => res.json())
            .then((data: TransitArrival[]) => {
                setArrivals(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to fetch transit data');
                setLoading(false);
            }); 
      }, []);
    if (loading) {
        return <div>Loading...</div>;
    }
    return (
        <div className="p-4">
      <h2 className="text-xl font-bold mb-4">SF Muni Arrivals</h2>
      <div className="grid gap-2">
        {arrivals.map((bus, index) => (
          <div key={index} className="border p-3 rounded shadow-sm">
            <span className="font-bold">{bus.published_line_name}</span> to {bus.destination_display}
            <p className="text-blue-600">
              Arriving: {new Date(bus.expected_arrival_time).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
    )
};
