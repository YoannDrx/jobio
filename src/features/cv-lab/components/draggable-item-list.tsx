"use client";

import { type ReactNode } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

type DraggableItemListProps<T extends { id: string }> = {
  droppableId: string;
  items: T[];
  onReorder: (newItemIds: string[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
};

export function DraggableItemList<T extends { id: string }>({
  droppableId,
  items,
  onReorder,
  renderItem,
}: DraggableItemListProps<T>) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const newItems = [...items];
    const [moved] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, moved);
    onReorder(newItems.map((item) => item.id));
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-3"
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(draggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    className="rounded-md border"
                    aria-roledescription="élément réordonnable"
                  >
                    <div className="flex">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground flex items-center px-1.5"
                        {...draggableProvided.dragHandleProps}
                        title="Glisser pour reordonner"
                        aria-label="Glisser pour réordonner"
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        {renderItem(item, index)}
                      </div>
                    </div>
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
}
