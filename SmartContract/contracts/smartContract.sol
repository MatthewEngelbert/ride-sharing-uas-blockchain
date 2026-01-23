// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract rideShare {

    // Status ride sekarang
    enum Status {
        Requested,
        Accepted,
        Funded,
        Started,
        CompletedByDriver,
        Finalized,
        Cancelled
    }

    // Data driver
    struct Driver {
        string name;
        string phoneNumber;
        string vehicleType;
        string plateNumber;
        uint256 fare;
        bool registered;
    }

    // Data ride
    struct Ride {
        address payable rider;
        address payable driver;
        uint256 fare;
        Status status;
    }

    // Mapping data driver dan ride
    mapping(address => Driver) public drivers;
    address[] public driverAddresses;
    mapping(uint256 => Ride) public rides;

    // Jumlah ride
    uint256 public rideCount;

    // Register driver
    function registerDriver(
        string calldata _name,
        string calldata _phoneNumber,
        string calldata _vehicleType,
        string calldata _plateNumber,
        uint256 _fare
    ) external {
        require(!drivers[msg.sender].registered);
        require(_fare > 0);

        drivers[msg.sender] = Driver(
            _name,
            _phoneNumber,
            _vehicleType,
            _plateNumber,
            _fare,
            true
        );
        driverAddresses.push(msg.sender);
    }

    // Get driver
    function getDriver(address _driver) external view returns (string memory, string memory, string memory, string memory, uint256, bool) {
        Driver memory d = drivers[_driver];
        return (
            d.name,
            d.phoneNumber,
            d.vehicleType,
            d.plateNumber,
            d.fare,
            d.registered
        );
    }

    function getDriverCount() external view returns (uint256) {
        return driverAddresses.length;
    }

    function requestRide() external payable {
        require(msg.value > 0, "Fare must be greater than 0");

        rideCount++;

        rides[rideCount] = Ride(
            payable(msg.sender),
            payable(address(0)),
            msg.value,
            Status.Requested
        );
    }

    function acceptRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(drivers[msg.sender].registered, "Not a registered driver");
        require(ride.status == Status.Requested, "Ride not available");

        ride.driver = payable(msg.sender);
        ride.status = Status.Accepted;
    }

    function startRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.driver, "Only driver can start");
        require(ride.status == Status.Accepted, "Ride must be accepted");

        ride.status = Status.Started;
    }

    function completeRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.driver, "Only driver can complete");
        require(ride.status == Status.Started, "Ride must be started");

        ride.status = Status.CompletedByDriver;
    }

    function finishRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.rider, "Only rider");
        require(
            ride.status == Status.Accepted || 
            ride.status == Status.Started || 
            ride.status == Status.CompletedByDriver,
            "Invalid ride status for finishing"
        );

        ride.status = Status.Finalized;

        (bool success, ) = ride.driver.call{value: ride.fare}("");
        require(success, "Payout failed");
    }

    function cancelRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.rider, "Only rider can cancel");
        require(
            ride.status == Status.Requested ||
            ride.status == Status.Accepted,
            "Cannot cancel"
        );

        ride.status = Status.Cancelled;
        
        (bool success, ) = ride.rider.call{value: ride.fare}("");
        require(success, "Refund failed");
    }
}
