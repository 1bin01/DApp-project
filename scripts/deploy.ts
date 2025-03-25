import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  const BalanceGame = await ethers.getContractFactory("BalanceGame");
  const balanceGame = await BalanceGame.deploy();
  await balanceGame.waitForDeployment();

  const address = await balanceGame.getAddress();
  console.log(`BalanceGame deployed to ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 