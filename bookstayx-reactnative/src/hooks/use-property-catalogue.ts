import { useCallback, useEffect, useState } from "react";
import { properties as bundledProperties, type Property } from "@/data/discovery";
import { loadPropertyCatalogue, type PropertyCatalogue } from "@/services/api";

type State = { items: Property[]; loading: boolean; source: PropertyCatalogue["source"]; warning?: string };

export function usePropertyCatalogue() {
  const [state, setState] = useState<State>({ items: bundledProperties, loading: true, source: "bundled" });
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, warning: undefined }));
    const catalogue = await loadPropertyCatalogue();
    setState({ items: catalogue.data, loading: false, source: catalogue.source, warning: catalogue.warning });
  }, []);
  useEffect(() => {
    let active = true;
    void loadPropertyCatalogue().then((catalogue) => {
      if (active) setState({ items: catalogue.data, loading: false, source: catalogue.source, warning: catalogue.warning });
    });
    return () => { active = false; };
  }, []);
  return { ...state, refresh };
}
