export default {
  transactions: {
    criteriaList: [["from|to"]],
  },
  transfers: {
    criteriaList: [["tokenAddress"], ["from|to"], ["tokenAddress", "from|to"]],
  },
};
