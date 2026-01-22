import { useState, useEffect } from 'react';

const RiderDashboard = ({ contract, account }) => {
    const [fare, setFare] = useState('');
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [notes, setNotes] = useState('');
    const [myRides, setMyRides] = useState([]);
    const [status, setStatus] = useState('');

    const fetchMyRides = async () => {
        if (!contract) return;
        try {
            const rideCount = await contract.methods.rideCount().call();
            const rides = [];
            for (let i = 1; i <= rideCount; i++) {
                const ride = await contract.methods.rides(i).call();
                // Check if current user is the rider
                if (ride.rider.toLowerCase() === account.toLowerCase()) {
                    rides.push({ id: i, ...ride });
                }
            }
            setMyRides(rides);
        } catch (error) {
            console.error("Error fetching rides:", error);
        }
    };

    useEffect(() => {
        fetchMyRides();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchMyRides, 5000);
        return () => clearInterval(interval);
    }, [contract, account]);

    const handleRequestRide = async (e) => {
        e.preventDefault();
        if (!contract) return;

        // Note: Pickup, Destination, and Notes are collected here but cannot be stored 
        // on the blockchain without modifying the smart contract (which is restricted).
        // For this prototype, we'll log them and proceed with the fare transaction.
        console.log("Ride Request Details:", { pickup, destination, fare, notes });

        try {
            setStatus('Requesting ride...');
            await contract.methods.requestRide(fare).send({ from: account });
            setStatus('Ride requested successfully!');
            // Clear form
            setPickup('');
            setDestination('');
            setNotes('');
            setFare('');
            fetchMyRides();
        } catch (error) {
            console.error(error);
            setStatus('Request failed.');
        }
    };

    const handleFundRide = async (rideId, amount) => {
        try {
            setStatus(`Funding ride ${rideId}...`);
            await contract.methods.fundRide(rideId).send({ from: account, value: amount });
            setStatus('Ride funded!');
            fetchMyRides();
        } catch (error) {
            console.error(error);
            setStatus('Funding failed.');
        }
    };

    const handleConfirmArrival = async (rideId) => {
        try {
            setStatus(`Confirming arrival for ride ${rideId}...`);
            await contract.methods.confirmArrival(rideId).send({ from: account });
            setStatus('Ride finalized!');
            fetchMyRides();
        } catch (error) {
            console.error(error);
            setStatus('Confirmation failed.');
        }
    };

    const getStatusLabel = (status) => {
        const statuses = ["Requested", "Accepted", "Funded", "Started", "Completed", "Finalized", "Cancelled"];
        return statuses[status] || "Unknown";
    };

    return (
        <div>
            <div className="card">
                <h3>Request a New Ride</h3>
                <form onSubmit={handleRequestRide}>
                    <div>
                        <label>Pickup Location:</label>
                        <input
                            type="text"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Destination:</label>
                        <input
                            type="text"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Proposed Fare (Wei):</label>
                        <input
                            type="number"
                            value={fare}
                            onChange={(e) => setFare(e.target.value)}
                            required
                            min="1"
                        />
                    </div>
                    <div>
                        <label>Additional Notes (Optional):</label>
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <button type="submit">Request Ride</button>
                </form>
                {status && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
            </div>

            <div className="card">
                <h3>My Ride History</h3>
                {myRides.length === 0 ? (
                    <p>No rides found.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {myRides.map((ride) => (
                            <li key={ride.id} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <strong>Ride #{ride.id}</strong>
                                    <span className="status-badge" style={{ background: '#eafffa', color: '#40b39c', border: '1px solid #40b39c' }}>
                                        {getStatusLabel(ride.status)}
                                    </span>
                                </div>
                                <div>Fare: {ride.fare.toString()} Wei</div>
                                {/* Note: In a real app with revised contract, we would show Pickup/Dest here */}

                                <div style={{ marginTop: '10px' }}>
                                    {/* Status 1 = Accepted, need Funding */}
                                    {ride.status.toString() === "1" && (
                                        <button onClick={() => handleFundRide(ride.id, ride.fare)}>Fund Ride</button>
                                    )}
                                    {/* Status 4 = CompletedByDriver, need Confirmation */}
                                    {ride.status.toString() === "4" && (
                                        <button onClick={() => handleConfirmArrival(ride.id)}>Confirm Arrival</button>
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

export default RiderDashboard;
