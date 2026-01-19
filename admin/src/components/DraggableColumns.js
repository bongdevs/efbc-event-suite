import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const DraggableColumns = ({ columns, onDragEnd, onRemove }) => {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="columns" direction="horizontal">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        {columns.map((c,index) => (
                            <Draggable key={c} draggableId={c} index={index}>
                                {(prov, snapshot) => (
                                    <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        {...prov.dragHandleProps}
                                        style={{
                                            padding:'6px 12px',
                                            background: snapshot.isDragging ? '#0073aa' : '#f3f3f3',
                                            color: snapshot.isDragging ? '#fff' : '#000',
                                            border:'1px solid #ddd',
                                            borderRadius:'4px',
                                            cursor:'grab',
                                            boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.1)',
                                            transition:'all 0.2s ease',
                                            transform: snapshot.isDragging ? `${prov.draggableProps.style?.transform} scale(1.05)` : prov.draggableProps.style?.transform
                                        }}
                                    >
                                        {c}
                                        <button
                                            onClick={() => onRemove(c)}
                                            style={{ marginLeft:'6px', color:'red', border:'none', background:'transparent', cursor:'pointer'}}
                                        >✕</button>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export default DraggableColumns;
