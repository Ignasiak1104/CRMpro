
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Deal, Stage, Company } from '../types';

interface KanbanBoardProps {
  deals: Deal[];
  companies: Company[];
  onMoveDeal: (dealId: string, newStage: Stage) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ deals, companies, onMoveDeal }) => {
  const stages = Object.values(Stage);
  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'Firma';

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    onMoveDeal(draggableId, destination.droppableId as Stage);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6 -mx-10 px-10 h-[calc(100vh-220px)] scrollbar-hide">
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);

          return (
            <div key={stage} className="flex-shrink-0 w-80 flex flex-col">
              <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">{stage}</h3>
                  <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 border border-slate-100 shadow-sm">
                    {stageDeals.length}
                  </span>
                </div>
              </div>
              
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar transition-colors rounded-3xl p-2 ${
                      snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    {stageDeals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-5 rounded-2xl border transition-all ${
                              snapshot.isDragging 
                                ? 'shadow-2xl border-indigo-500 scale-105 z-50 rotate-2' 
                                : 'shadow-sm border-slate-100 hover:border-indigo-300'
                            } cursor-grab active:cursor-grabbing group`}
                          >
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-2">
                              {getCompanyName(deal.companyId)}
                            </p>
                            <h4 className="font-bold text-slate-900 text-sm leading-snug mb-4">
                              {deal.title}
                            </h4>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-slate-900 font-black text-sm">
                                {deal.value.toLocaleString()} PLN
                              </span>
                              <div className="flex -space-x-1">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                  {getCompanyName(deal.companyId)[0]}
                                </div>
                                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                                  AI
                                </div>
                              </div>
                            </div>

                            {/* Przycisk opcjonalny - Drag & Drop jest teraz głównym sposobem, ale zostawiamy czysty UI */}
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Chwyć by przenieść</span>
                              <span className="text-indigo-600 text-[14px]">⋮⋮</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
