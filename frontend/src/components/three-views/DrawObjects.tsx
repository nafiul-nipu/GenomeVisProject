import { Center } from "@react-three/drei";
import type { GeneSphereViewProps } from "../../types/data_types_interfaces";
import { GeneSphereView } from "./GeneSphereView";

export const DrawObject: React.FC<GeneSphereViewProps> = ({
  data,
  positionMode,
}) => {
  return (
    <Center>
      <GeneSphereView data={data} positionMode={positionMode} />
    </Center>
  );
};
