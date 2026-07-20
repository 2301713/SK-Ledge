import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SkLedgeModule", (m) => {
  // m.contract() tells Ignition to deploy the SkLedge contract.
  const skLedge = m.contract("SkLedge");

  return { skLedge };
});
