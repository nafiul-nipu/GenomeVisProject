import { forceSimulation, forceManyBody, forceLink, forceCenter } from "d3-force-3d";

export function forceSimulationPositionCalculation(networkData, numIteration){
    console.log("forceSimulationPositionCalculation")
    const simulation = forceSimulation(networkData.nodes, 3)
    .force("charge", forceManyBody().strength(-2))
    .force("link", forceLink(networkData.edges).id((d) => d.id))
    .force("center", forceCenter(0, 0, 0))
    .stop();

    console.log("simulation")

    console.log("loop")
    for (let i = 0; i < numIteration; i++) {
        console.log("looping")
        simulation.tick();
    }

    console.log("loop end")

    // console.log(networkData)

    // get the updated positions
    const updatedNodes = networkData.nodes.map((node) => ({
        ...node,
        coord: [node.x, node.y, node.z]
    }));

    console.log("updatedNodes")

    // add all edge positions in a single array
    let linePositions = [];
    networkData.edges.forEach((edge) => {
        // console.log(edge.source)
        // const sourceNode = updatedNodes[edge.source];
        linePositions.push(edge.source.x, edge.source.y, edge.source.z);
        // const targetNode = updatedNodes[edge.target];
        linePositions.push(edge.target.x, edge.target.y, edge.target.z);
    });
    return {
        nodes: updatedNodes,
        edges: networkData.edges,
        linePositions: linePositions,
    };

}