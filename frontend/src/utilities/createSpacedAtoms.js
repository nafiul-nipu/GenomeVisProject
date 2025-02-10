export function spacedAtomCalculation(networkData, spaceValue){
    networkData.nodes.forEach((node) => {
        node.coord = [node.coord[0] * spaceValue, node.coord[1] * spaceValue, node.coord[2] * spaceValue];
        // node.x = node.x * spaceValue
        // node.y = node.y * spaceValue
        // node.z = node.z * spaceValue
    });

    // NOTE: we dont need this in the current workflow - it was needed for the line geometry
    // add all edge positions in a single array
    // let linePositions = [];
    // networkData.edges.forEach((edge) => {
    //     const sourceNode = networkData.nodes[edge.source - 1]; // -1 because node ids start from 1
    //     // console.log(edge.source, sourceNode)
    //     linePositions.push(...sourceNode.coord);
    //     const targetNode = networkData.nodes[edge.target - 1]; // -1 because node ids start from 1
    //     linePositions.push(...targetNode.coord);
    // });

    // networkData.linePositions = linePositions;

    return networkData;

}