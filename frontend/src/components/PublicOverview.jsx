import { useState } from 'react';

const PublicOverview = ({ contract }) => {
    const [drivers, setDrivers] = useState([]);
    const [rides, setRides] = useState([]);
    const [status, setStatus] = useState('');

    const fetchData = async () => {
        if (!contract) return;
        try {
            setStatus('Fetching data');

            // Fetch Drivers
            const dsCount = await contract.getDriverCount();
            const driverCount = Number(dsCount);
            const driverList = [];
            for (let i = 0; i < driverCount; i++) {
                const addr = await contract.driverAddresses(i);
                const d = await contract.drivers(addr);
                driverList.push({
                    address: addr || '',
                    name: d?.name || 'Unknown',
                    fare: d?.fare ? d.fare.toString() : '0'
                });
            }
            setDrivers(driverList);

            // Fetch Rides
            const rCount = await contract.rideCount();
            const rideCount = Number(rCount);
            const rideList = [];
            for (let j = 1; j <= rideCount; j++) {
                const r = await contract.rides(j);
                rideList.push({
                    id: j,
                    rider: r?.rider || '',
                    driver: r?.driver || '',
                    fare: r?.fare ? r.fare.toString() : '0',
                    status: r?.status !== undefined ? Number(r.status) : 0
                });
            }
            setRides(rideList);
            setStatus('Data updated');
        } catch (error) {
            console.error(error);
            if (error.code === -32002 || error.message?.includes('too many errors')) {
                setStatus('RPC Rate Limit. Wait 1 min.');
            } else {
                setStatus('Failed to fetch data.');
            }
        }
    };

    const getStatusLabel = (s) => {
        const statuses = ["Requested", "Accepted", "Funded", "Started", "Completed", "Finalized", "Cancelled"];
        return statuses[s] || "Unknown";
    };

    return (
        <div className="public-overview">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>System Overview</h2>
                    <button onClick={() => fetchData()}>Refresh Overview</button>
                </div>
                {status && <p style={{ fontSize: '0.8rem', color: '#666' }}>{status}</p>}

                <div style={{ marginTop: '20px' }}>
                    <h3>Registered Drivers</h3>
                    {drivers.length === 0 ? <p>No drivers registered yet.</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th>Name</th>
                                    <th>Fare (Wei)</th>
                                    <th>Wallet Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drivers.map((d, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 0' }}>{d.name}</td>
                                        <td>{d.fare}</td>
                                        <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{d.address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ marginTop: '30px' }}>
                    <h3>All Orders</h3>
                    {rides.length === 0 ? <p>No orders yet.</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th>ID</th>
                                    <th>Status</th>
                                    <th>Fare (Wei)</th>
                                    <th>Rider</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rides.map((r) => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 0' }}>#{r.id}</td>
                                        <td>
                                            <span className={`status-badge status-${r.status}`}>
                                                {getStatusLabel(r.status)}
                                            </span>
                                        </td>
                                        <td>{r.fare}</td>
                                        <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                            {r.rider ? `${r.rider.substring(0, 6)}...${r.rider.substring(38)}` : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicOverview;
