import { $fetch } from "ohmyfetch";

import useContext from "./useContext";

export default (context = useContext()) => {
  const prividium = !!context.currentNetwork.value.prividium;

  if (!prividium) {
    return $fetch;
  }

  return $fetch.create({ credentials: "include" });
};
