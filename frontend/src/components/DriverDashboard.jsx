import { useState, useEffect, useCallback } from 'react';
import DriverRegistration from './DriverRegistration';

const DriverDashboard = ({ contract, account }) => {
    const [availableRides, setAvailableRides] = useState([]);
    const [myJobs, setMyJobs] = useState([]);
    const [status, setStatus] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const [driverDetails, setDriverDetails] = useState(null);
    const [checkingReg, setCheckingReg] = useState(true);

    const checkRegistration = useCallback(async () => {
        if (!contract || !account) return;
        try {
            setCheckingReg(true);
            const d = await contract.drivers(account);
            if (d.registered) {
                setIsRegistered(true);
                setDriverDetails({
                    name: d.name,
                    phone: d.phoneNumber,
                    vehicle: d.vehicleType,
                    plate: d.plateNumber,
                    fare: d.fare.toString()
                });
                fetchRides(true);
            } else {
                setIsRegistered(false);
                setDriverDetails(null);
            }
        } catch (error) {
            console.error("Error checking registration:", error);
        } finally {
            setCheckingReg(false);
        }
    }, [contract, account]);

    useEffect(() => {
        checkRegistration();
    }, [checkRegistration]);

    const fetchRides = async (force = false) => {
        if (!contract) return;
        try {
            const currentRideCount = Number(await contract.rideCount());

            const available = [];
            const jobs = [];

            for (let i = 1; i <= currentRideCount; i++) {
                const ride = await contract.rides(i);
                if (!ride) continue;

                if (ride.status !== undefined && ride.status.toString() === "0") {
                    available.push({
                        id: i,
                        status: ride.status,
                        fare: ride.fare || 0,
                        rider: ride.rider || '',
                        driver: ride.driver || ''
                    });
                }

                if (ride.driver && account && ride.driver.toLowerCase() === account.toLowerCase()) {
                    jobs.push({
                        id: i,
                        status: ride.status,
                        fare: ride.fare || 0,
                        rider: ride.rider || '',
                        driver: ride.driver || ''
                    });
                }
            }
            setAvailableRides(available);
            setMyJobs(jobs);
        } catch (error) {
            if (error.message?.includes('too many errors') || error.code === -32002) {
                setStatus("RPC Rate Limit: Please wait a minute before refreshing.");
                console.warn("RPC Rate limited.");
            } else {
                console.error("Error fetching rides:", error);
            }
        }
    };


    const handleAcceptRide = async (rideId) => {
        try {
            setStatus(`Accepting ride ${rideId}...`);
            const tx = await contract.acceptRide(rideId);
            await tx.wait();
            setStatus('Ride accepted!');
            fetchRides(true);
        } catch (error) {
            console.error(error);
            if (error.message?.includes('too many errors') || error.code === -32002) {
                setStatus('RPC Rate Limit: MetaMask is blocked.');
            } else {
                setStatus('Accept failed.');
            }
        }
    };

    const handleStartRide = async (rideId) => {
        try {
            setStatus(`Starting ride ${rideId}...`);
            const tx = await contract.startRide(rideId);
            await tx.wait();
            setStatus('Ride started!');
            fetchRides(true);
        } catch (error) {
            console.error(error);
            setStatus('Start failed.');
        }
    };

    const handleCompleteRide = async (rideId) => {
        try {
            setStatus(`Completing ride ${rideId}...`);
            const tx = await contract.completeRide(rideId);
            await tx.wait();
            setStatus('Ride completed!');
            fetchRides(true);
        } catch (error) {
            console.error(error);
            setStatus('Complete failed.');
        }
    };

    const getStatusLabel = (status) => {
        const statuses = ["Requested", "Accepted", "Funded", "Started", "Completed", "Finalized", "Cancelled"];
        return statuses[status] || "Unknown";
    };

    if (checkingReg) {
        return <div className="card">Checking driver status...</div>;
    }

    if (!isRegistered) {
        return (
            <div>
                <header>
                    <p>You are not registered as a driver yet.</p>
                </header>
                <section className="registration-section">
                    <DriverRegistration contract={contract} account={account} onSuccess={checkRegistration} />
                </section>
            </div>
        );
    }

    return (
        <div>
            <div className="card driver-profile">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Profile</h3>
                    <button onClick={() => checkRegistration()} style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Refresh Profile</button>
                </div>
                {driverDetails && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        <div><strong>Name:</strong> {driverDetails.name}</div>
                        <div><strong>Phone:</strong> {driverDetails.phone}</div>
                        <div><strong>Vehicle:</strong> {driverDetails.vehicle}</div>
                        <div><strong>Plate:</strong> {driverDetails.plate}</div>
                        <div><strong>Fare/Ride:</strong> {driverDetails.fare}Wei</div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <p>Status: {status}</p>
                <button onClick={() => fetchRides(true)} style={{ padding: '5px 10px' }}>Refresh Jobs</button>
            </div>

            <div className="card">
                <h3>Available Requests</h3>
                {availableRides.length === 0 ? (
                    <p>No new ride requests.</p>
                ) : (
                    <ul>
                        {availableRides.map((ride) => (
                            <li key={ride.id} style={{ marginBottom: '10px' }}>
                                <strong>Ride #{ride.id}</strong> - Fare: {ride.fare ? ride.fare.toString() : '0'}
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
                                    {ride.status.toString() === "1" && (
                                        <button onClick={() => handleStartRide(ride.id)}>Start Ride</button>
                                    )}
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
