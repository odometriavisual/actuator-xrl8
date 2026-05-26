import { createContext } from "preact";
import { useContext, type Dispatch, type StateUpdater } from "preact/hooks";
import type { TrajetoriaNode } from "./types";

export type TrajetoriaContextType = {
  is_dirty: boolean,
  setIsDirty: Dispatch<StateUpdater<boolean>>,
  nodes: TrajetoriaNode[],
  setNodes: Dispatch<StateUpdater<TrajetoriaNode[]>>,
  getNextNodeId: () => number,
  encoder_host: string,
  setEncoder_host: Dispatch<StateUpdater<string>>,
};

export const TrajetoriaContext = createContext<TrajetoriaContextType>({
  is_dirty: true,
  setIsDirty: () => {},
  nodes: [],
  setNodes: _ns => {},
  getNextNodeId: () => 0,
  encoder_host: '',
  setEncoder_host: () => {},
});

export function useTrajetoria() {
  return useContext(TrajetoriaContext);
}
