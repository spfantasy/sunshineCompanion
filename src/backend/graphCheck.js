function hasCycle(nodes) {
    const graph = {};
    const visited = new Set();
    const stack = new Set();

    // Build the graph
    nodes.forEach(node => {
        graph[node.value] = node.parents;
    });

    // DFS function to check for cycles
    function dfs(node) {
        if (stack.has(node)) {
            // If the node is in the current stack, we have a cycle
            return true;
        }

        if (visited.has(node)) {
            // If the node has been visited and no cycle was found, skip it
            return false;
        }

        // Mark the node as visited and add it to the stack
        visited.add(node);
        stack.add(node);

        // Recur for all the parents (dependencies)
        for (let parent of graph[node] || []) {
            if (dfs(parent)) {
                return true;
            }
        }

        // Remove the node from the stack
        stack.delete(node);

        return false;
    }

    // Check each node for cycles
    for (let node of nodes) {
        if (dfs(node.value)) {
            return true;
        }
    }

    return false;
}
module.exports = {
    hasCycle
};