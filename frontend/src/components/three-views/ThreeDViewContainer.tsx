import { useAppSelector } from "../../redux-store/hooks";

export const ThreeDViewContainer = () => {
  const condition = useAppSelector((s) => s.ui.condTab);
  const gene_data = useAppSelector((s) => s.data).data?.gene_data;

  console.log("ThreeDViewContainer render:", { condition, gene_data });
  return <h4>3D View Container Placeholder</h4>;
};
