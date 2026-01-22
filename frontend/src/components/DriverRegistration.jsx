import { useState } from 'react';

const DriverRegistration = ({ contract, account, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        vehicleType: '',
        plateNumber: '',
        fare: ''
    });
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contract) return;

        try {
            setStatus('Registering');
            const tx = await contract.registerDriver(
                formData.name,
                formData.phone,
                formData.vehicleType,
                formData.plateNumber,
                formData.fare
            );
            await tx.wait(); // Tunggu Konfirmasi
            setStatus('Register Succes');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            let errorMessage = 'Registration failed.';

            if (error.message?.includes('user rejected')) {
                errorMessage = 'Transaction rejected.';
            }
            setStatus(errorMessage);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card">
            <div>
                <label>Name:</label>
                <input name="name" onChange={handleChange} required />
            </div>
            <div>
                <label>Phone Number:</label>
                <input name="phone" onChange={handleChange} required />
            </div>
            <div>
                <label>Vehicle Type:</label>
                <input name="vehicleType" onChange={handleChange} required />
            </div>
            <div>
                <label>Plate Number:</label>
                <input name="plateNumber" onChange={handleChange} required />
            </div>
            <div>
                <label>Fare (Wei):</label>
                <input name="fare" type="number" onChange={handleChange} required />
            </div>
            <button type="submit">Register Driver</button>
            {status && <p>{status}</p>}
        </form>
    );
};

export default DriverRegistration;
