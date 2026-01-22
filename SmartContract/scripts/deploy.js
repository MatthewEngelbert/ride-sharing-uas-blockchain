const hre = require("hardhat");

async function main() {
    const RideShare = await hre.ethers.getContractFactory("rideShare");
    const rideShare = await RideShare.deploy();

    await rideShare.waitForDeployment();

    const address = await rideShare.getAddress();
    console.log(`RideShare deployed to ${address}`);

    const fs = require('fs');
    fs.writeFileSync('deployed_address.txt', address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
