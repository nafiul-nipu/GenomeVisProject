import { Center } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useAppSelector } from "../../redux-store/hooks";
import type { DataInfoType } from "../../types/data_types_interfaces";

interface GeneSphereViewProps {
  meta_data: DataInfoType;
}

export const GeneSphereView: React.FC<GeneSphereViewProps> = ({
  meta_data,
}) => {
  const data = useAppSelector((s) => s.data.data?.gene_data);
  const { species, chromosome, condTab, timeIdx } = useAppSelector((s) => s.ui);
  console.log("Gene Sphere View");
  console.log(data);
  console.log(condTab, chromosome, timeIdx);
  console.log(meta_data[species]);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.5;
      ref.current.rotation.y += dt * 0.7;
    }
  });
  return (
    <Center>
      <mesh ref={ref}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial />
      </mesh>
      <axesHelper args={[5]} />
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial />
      </mesh>
    </Center>
  );
};
