import { $fetch } from "ohmyfetch";

import useContext from "./useContext";

export default (context = useContext()) => {
  const prividium = !!context.currentNetwork.value.prividium;

  const defaultConfig = prividium ? ({ credentials: "include" } as const) : {};

  return $fetch.create(defaultConfig);
};
