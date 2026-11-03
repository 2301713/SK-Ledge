import hre from "hardhat";

async function main() {
  await hre.network.connect();
  const ethers = (hre as any).ethers;

  if (!ethers) {
    throw new Error("Failed to initialize ethers plugin.");
  }

  // Palitan ng nakuha mong address pagkatapos ng deploy.ts
  const newContractAddress = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS"; 
  
  console.log("Connecting to SkLedge contract at:", newContractAddress);
  const SkLedge = await ethers.getContractFactory("SkLedge");
  const newContract = SkLedge.attach(newContractAddress);

  const barangayMapping: Record<string, number> = {
    "San Pascual": 104204001,
    "Poblacion": 104204002,
    "Sambat": 104204003,
  };

  const initialCeilings = [
    { name: "San Pascual", ceiling: ethers.parseEther("500000") },
    { name: "Poblacion", ceiling: ethers.parseEther("750000") },
    { name: "Sambat", ceiling: ethers.parseEther("300000") },
  ];

  for (const item of initialCeilings) {
    const barangayId = barangayMapping[item.name];
    if (barangayId) {
      console.log(`Setting ceiling for ${item.name} (ID: ${barangayId})...`);
      const tx = await (newContract as any).setCeiling(barangayId, item.ceiling);
      await tx.wait();
      console.log(`  └─ Success for ${item.name}!`);
    }
  }

  console.log("Migration finished successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});