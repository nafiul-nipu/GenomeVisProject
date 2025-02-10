export function divideIntoNetworks(edges) {
    const visited = new Set(); // Track visited nodes
    const networks = []; // Store the divided networks
  
    edges.forEach(({ source }) => {
      if (!visited.has(source)) {
        const network = []; // Store the edges for this network
        const stack = [source]; // Initialize stack with the starting node
  
        while (stack.length > 0) {
          const node = stack.pop();
          visited.add(node);
  
          // Find the edges connected to the current node
          const connectedEdges = edges.filter(({ source }) => source === node);
  
          // Add the connected edges to the network
          network.push(...connectedEdges);
  
          // Add unvisited target nodes to the stack
          connectedEdges.forEach(({ target }) => {
            if (!visited.has(target)) {
              stack.push(target);
            }
          });
        }
  
        networks.push(network); // Add the network to the networks array
      }
    });
  
    return networks;
  }
  