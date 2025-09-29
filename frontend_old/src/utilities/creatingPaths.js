/***
 * example: 
 * edges = [
 * {source: 1, target: 2},
 * {source: 1, target: 3},
 * {source: 2, target: 3},
 * {source: 2, target: 4},
 * {source: 3, target: 4},
 * ]
 * 
 * the function will create all unique paths
 * 
 * first path : [1, 2, 3]
 * second path: [1, 3, 4]
 * third path : [2, 4]
 * 
 */
export async function findAllPaths(edges) {
    let paths = [];
    let visited = new Set();

    for (let edge of edges) {
        let source = edge['source'];
        let target = edge['target'];

        // Exclude self-visiting connections
        if (source !== target) {
            // Check if they are already visited or not
            if (!visited.has(`${source}-${target}`) && !visited.has(`${target}-${source}`)) {
                visited.add(`${source}-${target}`);

                // Add the path
                // If the paths list is empty, add the first one
                if (paths.length === 0) {
                    paths.push([source, target]);
                } else {
                    // Iterate over all paths
                    let found = false;
                    for (let path of paths) {
                        if (path[path.length - 1] === source) {
                            path.push(target);
                            found = true;
                            break;
                        }
                    }
                    // If the source is not found in any path, add a new path
                    if (!found) {
                        paths.push([source, target]);
                    }
                }
            }
        }
    }

    return paths;

}