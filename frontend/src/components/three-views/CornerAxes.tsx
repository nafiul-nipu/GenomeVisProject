import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";

type Props = {
  size?: number; // length of world axes
  distance?: number; // how far in front of camera
  offsetX?: number; // left/right
  offsetY?: number; // up/down
};

export function CornerAxes({
  size = 8,
  distance = 20,
  offsetX = 12,
  offsetY = 12,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const forward = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());

  useFrame(() => {
    const g = groupRef.current;
    const cam = camera as THREE.PerspectiveCamera;
    if (!g || !cam) return;

    cam.getWorldDirection(forward.current).normalize();
    upVec.current.copy(cam.up).normalize();
    rightVec.current.crossVectors(forward.current, upVec.current).normalize();

    // in front of camera
    const pos = cam.position.clone();
    pos.addScaledVector(forward.current, distance);

    // bottom-left: left + down
    pos.addScaledVector(rightVec.current, -offsetX);
    pos.addScaledVector(upVec.current, -offsetY);

    g.position.copy(pos);

    // world-aligned so it “spins” when you orbit
    g.quaternion.identity();

    // keep it large
    g.scale.setScalar(4);
  });

  return (
    <group ref={groupRef}>
      <axesHelper args={[size]} />

      <Text
        position={[size + 0.24, 0, 0]}
        fontSize={0.4}
        color="#ff5555"
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>

      <Text
        position={[0, size + 0.24, 0]}
        fontSize={0.4}
        color="#55ff55"
        anchorX="center"
        anchorY="middle"
      >
        Y
      </Text>

      <Text
        position={[0, 0, size + 0.24]}
        fontSize={0.4}
        color="#5590ff"
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>
    </group>
  );
}
