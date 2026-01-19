
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Deal, Company, Pipeline } from '../types';

interface KanbanBoardProps {
  deals: Deal[];
  companies: Company[];
  pipelines: Pipeline[];
  activePipelineId: string;
  onPipelineChange: (id: string) => void;
  onMoveDeal: (dealId: string, newStage: string) => void;
  onQuickAddDeal: (stage: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  deals, 
  companies, 
  pipelines, 
  activePipelineId, 
  onPipelineChange, 
  onMoveDeal,
  onQuickAddDeal
}) => {
  const activePipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
  const stages = activePipeline.stages;
  
  const pipelineDeals = deals.filter(d => d.pipelineId === activePipelineId);

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'Firma';

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    onMoveDeal(draggableId, destination.droppableId);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 w-fit">
        {pipelines.map(p => (
          <button
            key={p.id}
            onClick={() => onPipelineChange(p.id)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activePipelineId === p.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex overflow-x-auto pb-4 gap-6 scrollbar-hide">
          {stages.map(stage => {
            const stageDeals = pipelineDeals.filter(d => d.stage === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-100/40 rounded-[32px] border border-slate-200/50">
                <div className="p-5 flex items-center justify-between border-b border-slate-200/30">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${stage === 'Pozyskany' ? 'bg-green-500' : stage === 'Utracony' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                    <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-wider">{stage}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black text-slate-500 shadow-sm border border-slate-100">
                      {stageDeals.length}
                    </span>
                    <button 
                      onClick={() => onQuickAddDeal(stage)}
                      className="w-6 h-6 flex items-center justify-center bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all text-sm font-black"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 overflow-y-auto px-4 pb-4 space-y-4 pt-4 transition-all duration-300 rounded-b-[32px] ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}>
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-white p-5 rounded-2xl border transition-all duration-300 ${snapshot.isDragging ? 'shadow-2xl border-indigo-500 scale-105 z-50 rotate-1' : 'shadow-sm border-slate-200/60 hover:border-indigo-300 hover:shadow-md'}`}>
                              <div className="flex justify-between items-start mb-3">
                                <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">{getCompanyName(deal.companyId)}</p>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm leading-tight mb-4 min-h-[40px]">{deal.title}</h4>
                              <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                                <div>
                                  <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Wartość</p>
                                  <p className="text-slate-900 font-black text-sm">{deal.value.toLocaleString()} <span className="text-[10px] text-slate-400">PLN</span></p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Opiekun</span>
                                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm overflow-hidden" title={deal.owner}>
                                    {deal.owner ? deal.owner[0] : '?'}
                                  </div>
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
              </div>
            );
          })}
          <div className="flex-shrink-0 w-4" />
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
