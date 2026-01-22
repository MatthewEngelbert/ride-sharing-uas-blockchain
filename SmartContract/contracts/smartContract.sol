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

    function requestRide(uint256 _fare) external {
        require(_fare > 0);

        rideCount++;

        rides[rideCount] = Ride(
            payable(msg.sender),
            payable(address(0)),
            _fare,
            Status.Requested
        );
    }

    function acceptRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(drivers[msg.sender].registered);
        require(ride.status == Status.Requested);

        ride.driver = payable(msg.sender);
        ride.status = Status.Accepted;
    }

    function fundRide(uint256 _rideId) external payable {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.rider);
        require(ride.status == Status.Accepted);
        require(msg.value == ride.fare);

        ride.status = Status.Funded;
    }

    function startRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.driver);
        require(ride.status == Status.Funded);

        ride.status = Status.Started;
    }

    function completeRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.driver);
        require(ride.status == Status.Started);

        ride.status = Status.CompletedByDriver;
    }

    function confirmArrival(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.rider);
        require(ride.status == Status.CompletedByDriver);

        ride.status = Status.Finalized;

        (bool success, ) = ride.driver.call{value: ride.fare}("");
        require(success);
    }

    function cancelRide(uint256 _rideId) external {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.rider);
        require(
            ride.status == Status.Requested ||
            ride.status == Status.Accepted
        );

        ride.status = Status.Cancelled;
    }
}
