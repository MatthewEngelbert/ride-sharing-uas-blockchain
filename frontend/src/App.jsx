import { useState, useEffect } from 'react';
import Web3 from 'web3';
import RideShareABI from './contracts/RideShare.json';
import DriverRegistration from './components/DriverRegistration';
import RiderDashboard from './components/RiderDashboard';
import DriverDashboard from './components/DriverDashboard';
import './App.css';

function App() {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [role, setRole] = useState('rider'); // 'rider' or 'driver'
    const [loading, setLoading] = useState(true);

    const CONTRACT_ADDRESS = "0x2Ff9adDb6d7Ff7d1a970776cCBb3ee3Ee1896fCA";

    useEffect(() => {
        const loadWeb3 = async () => {
            if (window.ethereum) {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const web3 = new Web3(window.ethereum);

                    const accounts = await web3.eth.getAccounts();
                    setAccount(accounts[0]);

                    const deployedContract = new web3.eth.Contract(
                        RideShareABI.abi,
                        CONTRACT_ADDRESS
                    );
                    setContract(deployedContract);

                    window.ethereum.on('accountsChanged', (accounts) => {
                        setAccount(accounts[0]);
                    });

                } catch (error) {
                    console.error("User denied web3 access or error:", error);
                }
            } else {
                console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
            }
            setLoading(false);
        };

        loadWeb3();
    }, []);

    if (loading) return <div>Loading Web3...</div>;
    if (!account) return <div>Please connect your wallet (MetaMask) to use this app.</div>;

    return (
        <div className="container">
            <header>
                <h1>RideShare</h1>
                <p>Connected Account: {account}</p>
                <div className="role-selector">
                    <button
                        className={role === 'rider' ? 'active' : ''}
                        onClick={() => setRole('rider')}
                    >
                        Rider View
                    </button>
                    <button
                        className={role === 'driver' ? 'active' : ''}
                        onClick={() => setRole('driver')}
                    >
                        Driver View
                    </button>
                </div>
            </header>

            <main>
                {role === 'driver' && (
                    <>
                        <section className="registration-section">
                            <h2>Driver Registration</h2>
                            <DriverRegistration contract={contract} account={account} />
                        </section>
                        <section className="dashboard-section">
                            <h2>Driver Dashboard</h2>
                            <DriverDashboard contract={contract} account={account} />
                        </section>
                    </>
                )}

                {role === 'rider' && (
                    <section className="dashboard-section">
                        <h2>Rider Dashboard</h2>
                        <RiderDashboard contract={contract} account={account} />
                    </section>
                )}
            </main>
        </div>
    );
}

export default App;
