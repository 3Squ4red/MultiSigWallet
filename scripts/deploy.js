async function main() {
  const accounts = await ethers.getSigners();
  const owners = accounts.slice(0, 5).map((a) => a.address);
  const minContribution = 3;

  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  const wallet = await MultiSigWallet.deploy(owners, minContribution);
  await wallet.deployed();

  console.log(`MultiSigWallet deployed to ${wallet.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
