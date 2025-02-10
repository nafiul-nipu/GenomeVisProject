import { useRef, useLayoutEffect, useEffect, useState } from "react";
import { Object3D, Color, Raycaster, Vector2 } from "three";
import { useThree } from "@react-three/fiber";
import { chain_colors } from "./chainColors";

const object = new Object3D();

const NodeRenderer = (props) => {
  const isMountedRef = useRef(false);
  const meshRef = useRef();
  const { camera } = useThree();
  const [raycaster] = useState(() => new Raycaster());
  const [mouse, setMouse] = useState(null);

  // on Mount
  useLayoutEffect(() => {
    isMountedRef.current = true;

    meshRef.current.setColorAt(0, new Color());

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // instancing
  useLayoutEffect(() => {
    if (!isMountedRef.current) return;

    // console.log("number of nodes", props.nodes.length);
    // console.log("node rendering started");

    // console.log(props.nodes);

    props.nodes.forEach((node, index) => {
      // if node has radius apply it to the object
      if (node.radius) {
        // console.log('radius found')
        let radii = parseFloat(node.radius);
        object.scale.set(radii, radii, radii);
      } else if (props.toggleGene === true) {
        object.scale.set(0, 0, 0);
      } else {
        object.scale.set(1, 1, 1);
      }
      object.position.set(node.coord[0], node.coord[1], node.coord[2]);
      object.updateMatrix();
      meshRef.current.setMatrixAt(index, object.matrix);
      // console.log(node.chain, new Color(chain_colors[node.chain]))
      meshRef.current.setColorAt(
        index,
        node.chain
          ? new Color(chain_colors[node.chain])
          : new Color(chain_colors[props.chromosome])
      );
    });
    meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.instanceMatrix.needsUpdate = true;

    // console.log("node rendering ended");
  }, [props.nodes, props.toggleGene, props.gene_id]);

  useEffect(() => {
    // console.log("atom slider changed");
    props.nodes.forEach((node, index) => {
      object.scale.set(props.atomSlider, props.atomSlider, props.atomSlider);

      object.position.set(node.coord[0], node.coord[1], node.coord[2]);
      object.updateMatrix();
      meshRef.current.setMatrixAt(index, object.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [props.atomSlider]);

  // reference https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_raycast.html
  const handlePointerMove = (event) => {
    // console.log("handle pointer move");
    event.stopPropagation();
    // Get the canvas element and its bounding box
    const canvas = document.getElementById(props.canvasID);
    const rect = canvas.getBoundingClientRect();
    // console.log(rect.width, rect.height)

    setMouse({
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((event.clientY - rect.top) / rect.height) * 2 + 1,
    });
    // // Update the mouse position
    // setMouse({
    //     x: (event.clientX / window.innerWidth) * 2 - 1,
    //     y: -(event.clientY / window.innerHeight) * 2 + 1,
    // });
  };

  const handlePointerOut = () => {
    setMouse(null);
    // Reset the selected node details when the mouse moves out
    props.setNodeDetails(null);
  };

  const handleOnClick = () => {
    // console.log(props.nodeDetails);
    // console.log(props.nodes[props.nodeDetails])
    // if (props.nodeDetails)
    //   props.setGene(props.nodes[props.nodeDetails].gene_id);
  };

  // on mouse over change color
  useEffect(() => {
    // console.log("MOUSE MOVED !!!! CHANGE COLORS AND GET NODE DETAILS");
    // console.log(mouse);

    // color all the atoms according to their chromosomal group
    if (meshRef.current && raycaster && mouse) {
      // console.log(mouse);
      // Reset all colors to default chain colors
      props.nodes.forEach((node, index) => {
        meshRef.current.setColorAt(
          index,
          node.chain
            ? new Color(chain_colors[node.chain])
            : new Color(chain_colors[props.chromosome])
        );
      });

      // Raycast to get the intersection
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(meshRef.current);
      // console.log('intersects', intersects)
      if (intersects.length > 0) {
        const selectedInstanceId = intersects[0].instanceId;
        props.setNodeDetails(selectedInstanceId);
        // console.log('selected node', selectedInstanceId)
        // console.log('selected node', props.nodes[selectedInstanceId].coord)
        // console.log("mouse", mouse)

        // Get connected nodes
        const connectedNodes = new Set();
        connectedNodes.add(selectedInstanceId);
        props.edges.forEach((item) => {
          // instanced id starts from 0 and node id starts from 1
          // so we need to add 1 to the selectedInstanceId
          if (item.source === selectedInstanceId + 1) {
            // id of the target node is index - 1
            connectedNodes.add(item.target - 1);
          } else if (item.target === selectedInstanceId + 1) {
            // id of the source node is index - 1
            connectedNodes.add(item.source - 1);
          }
        });

        // console.log('connected nodes', connectedNodes)
        // console.log(props.nodeDetails)
        // console.log(connectedNodes)

        //and set their colors
        connectedNodes.forEach((item) => {
          if (item === props.nodeDetails) {
            meshRef.current.setColorAt(item, new Color("#FF69B4"));
          } else {
            meshRef.current.setColorAt(item, new Color("#000000"));
          }
          // meshRef.current.setColorAt(item, new Color("#000000"));
        });
      }

      meshRef.current.instanceColor.needsUpdate = true;
    } else {
      // props.setNodeDetails(null);
      props.nodes.forEach((node, index) => {
        meshRef.current.setColorAt(
          index,
          node.chain
            ? new Color(chain_colors[node.chain])
            : new Color(chain_colors[props.chromosome])
        );
      });
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [mouse]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, props.nodes.length]}
      frustumCulled={true}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleOnClick}
    >
      {/* if needed to lower the resolution to handle many points */}
      {/* <sphereGeometry args={[0.25, 12, 12]} /> */}
      <sphereGeometry args={[0.25, 32, 32]} />
      {/* <meshBasicMaterial color="#fc0334" /> */}
      <meshPhongMaterial
        // color={nodeCtl.color}
        emissive={props.nodeCtl.emissive}
        specular={props.nodeCtl.specular}
        shininess={props.nodeCtl.shininess}
      />
    </instancedMesh>
  );
};

export default NodeRenderer;
