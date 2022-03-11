import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import hostalAbi from '../contract/hostal.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18;
const HContractAddress = "0x014B8d9A527bE91B3067497bd3B84D5eFe566251";
const erc20Address = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit, contract;
let hostels = [], services = [];


const connectCeloWallet = async function () {
  if (window.celo) {
      notification("⚠️ Please approve this DApp to use it.")
      serviceNotificationOff()
    try {
      await window.celo.enable()
      notificationOff()
      serviceNotificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(hostalAbi, HContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
    serviceNotificationOff()
  }
}

async function paymentApproval(_price) {
  const ERCContract = new kit.web3.eth.Contract(erc20Abi, erc20Address)

  const result = await ERCContract.methods.approve(HContractAddress, _price).send({
    from: kit.defaultAccount
  })

  return result
}


const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

const gethostels = async function() {
  const _hostelsLength = await contract.methods.getHostelsLength().call()
  document.querySelector("#hostelCounts").textContent = _hostelsLength + ' hostels';

  const _hostels = []
    for (let i = 0; i < _hostelsLength; i++) {
    let _hostel = new Promise(async (resolve, reject) => {
      let h = await contract.methods.readHostel(i).call()
      resolve({
        index: i,
        owner: h.owner,
        name: h.name,
        image: h.image,
        description: h.description,
        location: h.location,
        fee: new BigNumber(h.serviceFee),
        price: new BigNumber(h.price),
        sold: h.sold
      })
    })
    _hostels.push(_hostel)
  }
  hostels = await Promise.all(_hostels)
  renderhostels()
}
const getServiceHires = async function (serviceIndex, hiresLength) {
  const _hires = [];
  for (let index = 0; index < hiresLength; index++) {
    let _hire = new Promise(async (resolve, reject) => {
      await contract.methods.getServiceHire(serviceIndex, index).call().then((h) => {
        resolve({
          index: index,
          hirer: h.hirer,
          timestamp: new Date(h.timestamp * 1000).toUTCString()
        })
      })
    });
    _hires.push(_hire)
  }
  return await Promise.all(_hires)
}

const getServices = async function() {
  const _servicesLength = await contract.methods.getServicesLength().call()
  document.querySelector("#trainersCounts").textContent = _servicesLength + ' services';

  const _services = []
    for (let i = 0; i < _servicesLength; i++) {
    let _service = new Promise(async (resolve, reject) => {
      let s = await contract.methods.getService(i).call()

      resolve({
        index: i,
        user: s.user,
        name: s.name,
        image: s.image,
        description: s.description,
        location: s.location,
        contact: s.contact,
        rate: new BigNumber(s.rate),
        hiresLength: s.hiresLength,
        hires: await getServiceHires(i, s.hiresLength)
      })
    })
    _services.push(_service)
  }
  services = await Promise.all(_services)
  renderServices()
}

document
  .querySelector("#newHostelBtn")
  .addEventListener("click", async (e) => {
    let newHostelBookingPrice = document.getElementById("newHostelBookingPrice").value;
    let HostelPrice = new BigNumber(newHostelBookingPrice).shiftedBy(ERC20_DECIMALS).toString();
    let HostelFee = new BigNumber(0.05 * newHostelBookingPrice).shiftedBy(ERC20_DECIMALS).toString();

    const params = [
      document.getElementById("newHostelName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newHostelDescription").value,
      document.getElementById("newHostelLocation").value,
      HostelFee,
      HostelPrice
    ]

    notification(`⌛ Adding "${params[0]}"...`)
    try {
      await contract.methods.writeHostels(...params).send({
        from: kit.defaultAccount
      }).then(() => {
        notification(`🎉 You successfully added "${params[0]}".`)
        gethostels()
      }).catch((err) => {
        notification(`⚠️ ${err}.`)
      })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  })

document
  .querySelector("#newServiceBtn")
  .addEventListener("click", async (e) => {
    const serviceParams = [
      document.getElementById("newServiceName").value,
      document.getElementById("newServiceImgUrl").value,
      document.getElementById("newServiceDescription").value,
      document.getElementById("newServiceLocation").value,
      document.getElementById("newServiceContact").value,
      new BigNumber(document.getElementById("newServiceRate").value).shiftedBy(ERC20_DECIMALS).toString()
    ]

    serviceNotification(`⌛ Adding "${serviceParams[0]}"...`)
    try {
      await contract.methods.addService(...serviceParams).send({
        from: kit.defaultAccount
      }).then(() => {
        serviceNotification(`🎉 You successfully added "${serviceParams[0]}".`)
        getServices()
      }).catch((err) => {
        serviceNotification(`⚠️ ${err}.`)
      })
    } catch (error) {
      serviceNotification(`⚠️ ${error}.`)
    }
  })

  window.addEventListener('load', async () => {
    notification("⌛ Loading...")
    await connectCeloWallet()
    await getBalance()
    await gethostels()
    await getServices()
    notificationOff()
  });

function renderhostels() {
  document.getElementById("Hostalmarketplace").innerHTML = ""
  hostels.forEach((_Hostel) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = HostelTemplate(_Hostel)
    document.getElementById("Hostalmarketplace").appendChild(newDiv)
  })
}
function renderServices() {
  document.getElementById("HostelAgentServices").innerHTML = ""
  services.forEach((_service) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-md-4"
    newDiv.innerHTML = serviceTemplate(_service)
    document.getElementById("HostelAgentServices").appendChild(newDiv)
  })
}
async function renderServiceHires(index, hires) {
  let hireID = await "service" + index + "Hires";

  if(hires) {
    document.getElementById(hireID).innerHTML = "";
    hires.forEach((_hire) => {
      const newUl = document.createElement("ul")
      newUl.innerHTML = hireTemplate(_hire)
      document.getElementById(hireID).appendChild(newUl)
    })
  } else {
    document.getElementById(hireID).innerHTML = "<p class='text-center'>No Service Hire</p>";
  }
}

function hireTemplate(_hire) {
  return `
    <li>${_hire.hirer} - ${_hire.timestamp}</li>
  `
}

function HostelTemplate(_Hostel) {
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_Hostel.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_Hostel.sold} Sold
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_Hostel.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_Hostel.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_Hostel.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_Hostel.location}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${
            _Hostel.index
          }>
            Book for ${_Hostel.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)}(${_Hostel.fee.shiftedBy(-ERC20_DECIMALS).toFixed(2)}) cUSD
          </a>
        </div>
      </div>
    </div>
  `
}
function serviceTemplate(_service) {
  renderServiceHires(_service.index, _service.hires)

  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_service.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        <button type="button" class="btn btn-link" data-bs-toggle="modal" data-bs-target="#service${_service.index}Modal" style="text-decoration: none;">
          ${_service.hiresLength} Hires
        </button>
      </div>
      <div class="card-body text-dark text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_service.user)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_service.name}</h2>
        <p class="card-text mb-1">
          ${_service.contact}             
        </p>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_service.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-geo-alt-fill"></i>
          <span>${_service.location}</span>
        </p>
        <div class="d-grid gap-2">
        <a class="btn btn-lg btn-outline-dark hireBtn fs-6 p-3" id=${
          _service.index
        }>
          Hire for ${_service.rate.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
        </a>
      </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="service${_service.index}Modal" tabindex="-1" aria-labelledby="service${_service.index}ModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content text-dark">
          <div class="modal-header">
            <h5 class="modal-title" id="service${_service.index}ModalLabel">${_service.name} Hires</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="service${_service.index}Hires"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `
}


function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert-Hostel").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert-Hostel").style.display = "none"
}

function serviceNotification(_text) {
  document.querySelector(".alert-service").style.display = "block"
  document.querySelector("#serviceNotification").textContent = _text
}

function serviceNotificationOff() {
  document.querySelector(".alert-service").style.display = "none"
}

document.querySelector("#Hostalmarketplace").addEventListener("click", async (e) => {
  if(e.target.className.includes("buyBtn")) {
    const index = e.target.id;
    notification("⌛ Waiting for payment approval...");
    try {
      let bigSum = BigInt(hostels[index].price) + BigInt(hostels[index].fee);
      const HostelAmountSum = bigSum.toString();
      await paymentApproval(HostelAmountSum);
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`⌛ Awaiting payment for "${hostels[index].name}"...`)
    try {
      await contract.methods.buyHostel(index).send({
        from: kit.defaultAccount
      })
      notification(`🎉 You successfully bought "${hostels[index].name}".`)
      getBalance()
      gethostels()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})

// trigger when the hire button is clicked
document.querySelector("#HostelAgentServices").addEventListener("click", async (e) => {
  if(e.target.className.includes("hireBtn")) {
    const index = e.target.id;
    let servicePrice = BigInt(services[index].rate).toString();
    console.log(servicePrice);

    serviceNotification("⌛ Waiting for payment approval...");
    try {
      await paymentApproval(servicePrice);
    } catch (error) {
      serviceNotification(`⚠️ ${error}.`)
    }
    serviceNotification(`⌛ Awaiting payment to hire "${services[index].name}"...`)
    try {
      await contract.methods.hireService(index, servicePrice).send({
        from: kit.defaultAccount
      })
      serviceNotification(`🎉 You successfully hired "${services[index].name}".`)
      getBalance()
      getServices()
    } catch (error) {
      serviceNotification(`⚠️ ${error}.`)
    }
  }
})



