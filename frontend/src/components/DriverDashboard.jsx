import { useState, useEffect } from 'react';

const DriverDashboard = ({ contract, account }) => {
    const [availableRides, setAvailableRides] = useState([]);
    const [myJobs, setMyJobs] = useState([]);
    const [status, setStatus] = useState('');

    const fetchRides = async () => {
        if (!contract) return;
        try {
            const rideCount = await contract.methods.rideCount().call();
            const available = [];
            const jobs = [];

            for (let i = 1; i <= rideCount; i++) {
                const ride = await contract.methods.rides(i).call();

                // Available: Status is Requested (0)
                if (ride.status.toString() === "0") {
                    available.push({ id: i, ...ride });
                }

                // My Jobs: Driver is me
                if (ride.driver.toLowerCase() === account.toLowerCase()) {
                    jobs.push({ id: i, ...ride });
                }
            }
            setAvailableRides(available);
            setMyJobs(jobs);
        } catch (error) {
            console.error("Error fetching rides:", error);
        }
    };

    useEffect(() => {
        fetchRides();
        const interval = setInterval(fetchRides, 5000);
        return () => clearInterval(interval);
    }, [contract, account]);

    const handleAcceptRide = async (rideId) => {
        try {
            setStatus(`Accepting ride ${rideId}...`);
            await contract.methods.acceptRide(rideId).send({ from: account });
            setStatus('Ride accepted!');
            fetchRides();
        } catch (error) {
            console.error(error);
            setStatus('Accept failed.');
        }
    };

    const handleStartRide = async (rideId) => {
        try {
            setStatus(`Starting ride ${rideId}...`);
            await contract.methods.startRide(rideId).send({ from: account });
            setStatus('Ride started!');
            fetchRides();
        } catch (error) {
            console.error(error);
            setStatus('Start failed.');
        }
    };

    const handleCompleteRide = async (rideId) => {
        try {
            setStatus(`Completing ride ${rideId}...`);
            await contract.methods.completeRide(rideId).send({ from: account });
            setStatus('Ride completed!');
            fetchRides();
        } catch (error) {
            console.error(error);
            setStatus('Complete failed.');
        }
    };

    const getStatusLabel = (status) => {
        const statuses = ["Requested", "Accepted", "Funded", "Started", "Completed", "Finalized", "Cancelled"];
        return statuses[status] || "Unknown";
    };

    return (
        <div>
            <p>Status: {status}</p>

            <div className="card">
                <h3>Available Requests</h3>
                {availableRides.length === 0 ? (
                    <p>No new ride requests.</p>
                ) : (
                    <ul>
                        {availableRides.map((ride) => (
                            <li key={ride.id} style={{ marginBottom: '10px' }}>
                                <strong>Ride #{ride.id}</strong> - Fare: {ride.fare.toString()}
                                <button onClick={() => handleAcceptRide(ride.id)} style={{ marginLeft: '10px' }}>
                                    Accept
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="card">
                <h3>My Active Jobs</h3>
                {myJobs.length === 0 ? (
                    <p>No active jobs.</p>
                ) : (
                    <ul>
                        {myJobs.map((ride) => (
                            <li key={ride.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                                <strong>Ride #{ride.id}</strong>
                                <span className="status-badge">Status: {getStatusLabel(ride.status)}</span>
                                <div style={{ marginTop: '5px' }}>
                                    {/* Status 2: Funded -> Can Start */}
                                    {ride.status.toString() === "2" && (
                                        <button onClick={() => handleStartRide(ride.id)}>Start Ride</button>
                                    )}
                                    {/* Status 3: Started -> Can Complete */}
                                    {ride.status.toString() === "3" && (
                                        <button onClick={() => handleCompleteRide(ride.id)}>Complete Ride</button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
