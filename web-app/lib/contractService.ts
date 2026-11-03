export const submitExpenseOnChain = async (skLedgeContract: any, barangayId: number, amount: bigint) => {
  const tx = await skLedgeContract.logExpense(barangayId, amount);
  await tx.wait();
  return tx;
};