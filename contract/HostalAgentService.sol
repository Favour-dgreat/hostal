// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface ServiceInterface {
  function readServicesLength() external view returns (uint);
  function readService(uint _index) external view returns (address user, string memory name, string memory image, string memory description, string memory location, string memory contact, uint rate, uint hiresLength);
  function readServiceHire(uint _serviceIndex, uint _hireIndex) external view returns (address hirer, uint timestamp);
  function writeService(string calldata _name, string calldata _image, string calldata _description, string calldata _location, string calldata _contact, uint _rate) external;
  function hireService(uint _index) external;
}

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract HostalService {

  struct Hire {
    address hirer;
    uint timestamp;
  }

  struct Service {
    address payable user;
    string name;
    string image;
    string description;
    string location;
    string contact;
    uint rate;
    uint hiresLength;
    mapping (uint => Hire) hires;
  }

  uint internal servicesLength = 0;
  mapping (uint => Service) internal services;
  address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

  event writeServiceEvent(
    address user,
    string name,
    string image,
    string description,
    string location,
    string contact,
    uint rate
  );

  event hireServiceEvent(
    address user,
    address hirer,
    uint amount,
    uint timestamp
  );

  function writeService(
    string memory _name,
    string memory _image,
    string memory _description, 
    string memory _location,
    string memory _contact,
    uint _rate
  ) external {
    uint _hiresLength = 0;

    Service storage newService = services[servicesLength];
    newService.user = payable(tx.origin);
    newService.name = _name;
    newService.image = _image;
    newService.description = _description;
    newService.location = _location;
    newService.contact = _contact;
    newService.rate = _rate;
    newService.hiresLength = _hiresLength;

    servicesLength++;

    emit writeServiceEvent(
      newService.user,
      newService.name,
      newService.image,
      newService.description,
      newService.location,
      newService.contact,
      newService.rate
    );
  }

  function readService(uint _index) external view returns (
    address user,
    string memory name, 
    string memory image, 
    string memory description, 
    string memory location, 
    string memory contact,
    uint rate,
    uint hiresLength
  ) {
    Service storage service = services[_index];
    return(
      service.user,
      service.name,
      service.image,
      service.description,
      service.location,
      service.contact,
      service.rate,
      service.hiresLength
    );
  }

  function readServiceHire(uint _serviceIndex, uint _hireIndex) external view returns (
    address hirer,
    uint timestamp
  ) {
    Hire storage hire = services[_serviceIndex].hires[_hireIndex];
    return(
      hire.hirer,
      hire.timestamp
    );
  }
  
  function hireService(uint _index) external {
    Service storage service = services[_index];

    Hire memory newHire = Hire(
      tx.origin,
      block.timestamp
    );
     
    IERC20Token(cUsdTokenAddress).transfer(
      service.user,
      service.rate
    );

    service.hires[service.hiresLength] = newHire;
    service.hiresLength++;

    emit hireServiceEvent(
      service.user,
      newHire.hirer,
      service.rate,
      newHire.timestamp
    );
  }

  function readServicesLength() external view returns (uint) {
    return (servicesLength);
  }
}