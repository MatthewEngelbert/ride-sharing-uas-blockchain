const hre = require("hardhat");

async function main() {
    const RideShare = await hre.ethers.getContractFactory("rideShare");
    const rideShare = await RideShare.deploy();

    await rideShare.waitForDeployment();

    console.log(
        `RideShare deployed to ${await rideShare.getAddress()}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
