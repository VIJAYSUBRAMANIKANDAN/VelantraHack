const hre = require("hardhat");

async function main() {
  const Escrow = await hre.ethers.getContractFactory("VelantraEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log("VelantraEscrow deployed to:", await escrow.getAddress());
  console.log("Copy this address into ESCROW_CONTRACT_ADDRESS in your .env file.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
