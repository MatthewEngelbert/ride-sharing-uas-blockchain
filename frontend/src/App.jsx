import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RideShareABI from './contracts/RideShare.json';
import RiderDashboard from './components/RiderDashboard';
import DriverDashboard from './components/DriverDashboard';
import './App.css';

function App() {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [role, setRole] = useState('rider'); // 'rider' or 'driver'
    const [loading, setLoading] = useState(true);

    const CONTRACT_ADDRESS = "0x15DEDb62Bc93E5e574CBF6aa3abA7FbfC56d8e76";

    const connectWallet = async () => {
        if (window.ethereum) {
            setLoading(true);
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const accounts = await provider.send("eth_requestAccounts", []);

                setAccount(accounts[0]);

                const deployedContract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    RideShareABI.abi,
                    signer
                );
                setContract(deployedContract);

                window.ethereum.on('accountsChanged', (accounts) => {
                    setAccount(accounts[0]);
                    window.location.reload();
                });

            } catch (error) {
                console.error("Connection error:", error);
                if (error.code === -32002 || error.message?.includes('too many errors')) {
                    alert("RPC Rate Limit: MetaMask is temporarily blocked. Please wait 1 minute or switch RPC in MetaMask (Settings > Networks > Sepolia).");
                } else {
                    alert("Failed to connect wallet: " + error.message);
                }
            }
            setLoading(false);
        } else {
            alert('Metamask not detected. Please install MetaMask!');
        }
    };

    if (!account) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
                <header>
                    <h1>RideShare</h1>
                    <p>Please connect your wallet to use the app.</p>
                    <button onClick={connectWallet} style={{ padding: '15px 30px', fontSize: '1.2rem', marginTop: '20px' }}>
                        Connect Wallet
                    </button>
                </header>
            </div>
        );
    }

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
                    <section className="dashboard-section">
                        <h2>Driver Dashboard</h2>
                        <DriverDashboard contract={contract} account={account} />
                    </section>
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
