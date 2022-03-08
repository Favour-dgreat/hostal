// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import './HostalAgentService.sol';


contract Hostal {

  struct Hostel {
    address payable owner;
    string name;
    string image;
    string description;
    string location;
    uint serviceFee;
    uint price;
    uint sold;
  }
  address payable internal serviceAddress;


  uint internal hostelsLength = 0;
  address payable internal ownerAddress;
  ServiceInterface internal ServiceContract;
  mapping (uint => Hostel) internal hostels;
  address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

  constructor(address serviceContractAddress) {
    ownerAddress = payable(msg.sender);
    serviceAddress = serviceContractAddress;
    ServiceContract = ServiceInterface(address(serviceContractAddress));
  }

  function writeHostels(
    string memory _name,
    string memory _image,
    string memory _description, 
    string memory _location,
    uint _serviceFee,
    uint _price
  ) public {
    uint _sold = 0;
    hostels[hostelsLength] = Hostel(
      payable(msg.sender),
      _name,
      _image,
      _description,
      _location,
      _serviceFee,
      _price,
      _sold
    );
    hostelsLength++;
  }

  function addService(
    string memory _name,
    string memory _image,
    string memory _description, 
    string memory _location,
    string memory _contact,
    uint _rate
  ) public {
    ServiceContract.writeService(_name, _image, _description, _location, _contact, _rate);
  }

  function readHostel(uint _index) public view returns (
    address payable owner,
    string memory name, 
    string memory image, 
    string memory description, 
    string memory location, 
    uint serviceFee,
    uint price, 
    uint sold
  ) {
    Hostel storage hostel = hostels[_index];
    return(
      hostel.owner,
      hostel.name,
      hostel.image,
      hostel.description,
      hostel.location,
      hostel.serviceFee,
      hostel.price,
      hostel.sold
    );
  }

  function getService(uint _index) public view returns(
    address user,
    string memory name, 
    string memory image, 
    string memory description, 
    string memory location, 
    string memory contact,
    uint rate,
    uint hiresLength
  ) {
    return ServiceContract.readService(_index);
  }

  function getServiceHire(uint _serviceIndex, uint _hireIndex) public view returns(
    address hirer,
    uint timestamp
  ) {
    return ServiceContract.readServiceHire(_serviceIndex, _hireIndex);
  }
    
  // hire a service
  function hireService(
   uint _index,
   uint _price,
  ) public {
    require(
      IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        payable(serviceAddress),
        _price
      ),
      "Failed to hire this service."
    );

    ServiceContract.hireService(_index);
  }
  
  function buyHostel(uint _index) public payable  {
    require(
      IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        ownerAddress,
        hostels[_index].serviceFee
      ),
      "hostels fee transfer failed."
    );
    require(
      IERC20Token(cUsdTokenAddress).transferFrom(
        msg.sender,
        hostels[_index].owner,
        hostels[_index].price
      ),
      "hostels price transfer failed."
    );
    hostels[_index].sold++;
  }
  
  function getHostelsLength() public view returns (uint) {
    return (hostelsLength);
  }

  function getServicesLength() public view returns (uint) {
    return ServiceContract.readServicesLength();
  }
}