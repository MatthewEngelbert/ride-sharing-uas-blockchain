import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const RiderDashboard = ({ contract, account }) => {
    const [fare, setFare] = useState('');
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [myRides, setMyRides] = useState([]);
    const [status, setStatus] = useState('');

    const fetchMyRides = async (force = false) => {
        if (!contract) return;
        try {
            const currentRideCount = Number(await contract.rideCount());

            if (!force && currentRideCount === myRides.length) return;

            const rides = [];
            for (let i = 1; i <= currentRideCount; i++) {
                const ride = await contract.rides(i);
                if (!ride) continue;

                if (ride.rider && account && ride.rider.toLowerCase() === account.toLowerCase()) {
                    rides.push({
                        id: i,
                        status: ride.status,
                        fare: ride.fare || 0,
                        rider: ride.rider || '',
                        driver: ride.driver || ''
                    });
                }
            }
            setMyRides(rides);
        } catch (error) {
            console.error("Error fetching rides:", error);
        }
    };

    const handleRequestRide = async (e) => {
        e.preventDefault();
        if (!contract) return;

        try {
            setStatus('Requesting ride');
            const tx = await contract.requestRide({
                value: ethers.parseUnits(fare, 'wei')
            });
            await tx.wait();
            setStatus('Ride requested and funded successfully!');
            // Clear form
            setPickup('');
            setDestination('');
            setFare('');
            fetchMyRides(true);
        } catch (error) {
            console.error(error);
            if (error.message?.includes('user rejected')) {
                setStatus('Transaction rejected.');
            }
        }
    };

    const handleFinishRide = async (rideId) => {
        try {
            setStatus(`Finishing ride ${rideId} and paying driver...`);
            const tx = await contract.finishRide(rideId);
            await tx.wait();
            setStatus('Ride finalized and driver paid!');
            fetchMyRides(true);
        } catch (error) {
            console.error(error);
            setStatus('Finish failed.');
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
                    <button type="submit">Request Ride</button>
                </form>
                {status && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>My Ride History</h3>
                    <button onClick={() => fetchMyRides(true)} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Refresh</button>
                </div>
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
                                <div>Fare: {ride.fare ? ride.fare.toString() : '0'} Wei</div>

                                <div style={{ marginTop: '10px' }}>
                                    {(ride.status !== undefined && (
                                        ride.status.toString() === "1" ||
                                        ride.status.toString() === "3" ||
                                        ride.status.toString() === "4"
                                    )) && (
                                            <button onClick={() => handleFinishRide(ride.id)}>Finish Ride & Pay Driver</button>
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
