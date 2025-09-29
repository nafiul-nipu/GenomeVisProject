
export function basicPositionCalculation(data){

    // NOTE: we dont need this in the current workflow - it was needed for the line geometry
        /**
     * creating line positions for edges
     * variable LinePositions = [startx, startY, startZ, 
     * endX, endY, endZ,.....]
     */
    // console.log(data)

        // let linePositions = [];
        // data.edges.forEach((edge) => {
        //     const sourceNode = data.nodes[edge.source - 1]; // -1 because node ids start from 1
        //     // console.log(edge.source, sourceNode)
        //     linePositions.push(...sourceNode.coord);
        //     const targetNode = data.nodes[edge.target - 1]; // -1 because node ids start from 1
        //     linePositions.push(...targetNode.coord);
        // })

        // // console.log(linePositions)    
        // data.linePositions = linePositions;

        // findAllPaths(data.edges)

        return data;
}