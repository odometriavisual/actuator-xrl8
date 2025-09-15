import { createContext } from "preact";
import { useContext, type Dispatch, type StateUpdater } from "preact/hooks";
import type { TrajetoriaNode } from "./types";

export type TrajetoriaContextType = {
  nodes: TrajetoriaNode[],
  setNodes: Dispatch<StateUpdater<TrajetoriaNode[]>>,
  getNextNodeId: () => number,
};

export const TrajetoriaContext = createContext<TrajetoriaContextType>({
  nodes: [],
  setNodes: _ns => {},
  getNextNodeId: () => 0,
});

export function useTrajetoria() {
  return useContext(TrajetoriaContext);
}
