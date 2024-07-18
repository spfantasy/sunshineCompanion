import dagre from '@dagrejs/dagre'
import { useVueFlow } from '@vue-flow/core'
import { ref } from 'vue'

/**
 * Composable to run the layout algorithm on the graph.
 * It uses the `dagre` library to calculate the layout of the nodes and edges.
 */
export function useLayout() {
    const { findNode } = useVueFlow()

    const graph = ref(new dagre.graphlib.Graph())

    function layout(nodes, edges) {
        // we create a new graph instance, in case some nodes/edges were removed, otherwise dagre would act as if they were still there
        const dagreGraph = new dagre.graphlib.Graph()

        graph.value = dagreGraph

        dagreGraph.setDefaultEdgeLabel(() => ({}))

        dagreGraph.setGraph({ rankdir: 'TB' });
        for (const node of nodes) {
            // if you need width+height of nodes for your layout, you can use the dimensions property of the internal node (`GraphNode` type)
            const graphNode = findNode(node.id)
            dagreGraph.setNode(node.id, { width: graphNode.dimensions.width || 300, height: graphNode.dimensions.height || 100 })
        }
        for (const edge of edges) {
            dagreGraph.setEdge(edge.source, edge.target)
        }
        dagre.layout(dagreGraph)
        // set nodes with updated positions
        return nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id)

            return {
                ...node,
                position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
            }
        })
    }

    return { graph, layout }
}
