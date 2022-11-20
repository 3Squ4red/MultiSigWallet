const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", () => {
  let accounts, owners, MIN_CONFIRMATIONS, wallet, MultiSigWallet;

  before(async () => {
    accounts = await ethers.getSigners();
    owners = [accounts[0], accounts[1], accounts[2], accounts[3], accounts[4]];
    MIN_CONFIRMATIONS = 3;
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  });

  describe("Deployment", () => {
    it("should not deploy with invalid mininimum contribution", async () => {
      const ownersAdd = owners.map((o) => o.address);
      await expect(
        MultiSigWallet.deploy(ownersAdd, MIN_CONFIRMATIONS + 10)
      ).to.be.revertedWith("invalid min contribution");
    });
    it("should not deploy with duplicate or zero address as owner", async () => {
      const zeroOwners = [
        accounts[0].address,
        ethers.constants.AddressZero,
        accounts[1].address,
      ];
      const dupOwners = [
        accounts[0].address,
        accounts[1].address,
        accounts[0].address,
      ];
      await expect(
        MultiSigWallet.deploy(zeroOwners, MIN_CONFIRMATIONS)
      ).to.be.revertedWith("invalid owner");
      await expect(
        MultiSigWallet.deploy(dupOwners, MIN_CONFIRMATIONS)
      ).to.be.revertedWith("owner not unique");
    });
    it("should deploy the contract successfully", async () => {
      const ownersAdd = owners.map((o) => o.address);
      wallet = await MultiSigWallet.deploy(ownersAdd, MIN_CONFIRMATIONS);
    });
  });

  describe("Execution", () => {
    it("Should successfully execute a transaction", async () => {
      // Submitting a transaction first
      await wallet.submitTransaction(accounts[5].address, 20, "0x00");

      // Sending 20 wei to the contract
      await owners[0].sendTransaction({
        to: wallet.address,
        value: 20,
      });

      // Confirming this transaction 3 times
      await wallet.confirmTransaction(0); // sent from accounts[0] by default
      await wallet.connect(owners[1]).confirmTransaction(0);
      await wallet.connect(owners[2]).confirmTransaction(0);

      // Finally executing the transaction
      await expect(wallet.executeTransaction(0))
        .to.emit(wallet, "ExecuteTransaction")
        .withArgs(owners[0].address, 0);

      // After executing the transaction, its 'executed' property must be true
      const tx = await wallet.transactions(0);
      expect(tx.executed).to.equal(true);
    });

    it("Should revert if the transaction is already executed", async () => {
      await expect(wallet.executeTransaction(0)).to.revertedWith(
        "tx already executed"
      );
    });
  });
});
