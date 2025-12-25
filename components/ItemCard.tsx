import React from 'react';
import { FoundItem } from '../types';
import { MapPin, Calendar, CheckCircle, CircleDashed } from 'lucide-react';

interface ItemCardProps {
  item: FoundItem;
  onClick: (item: FoundItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  return (
    <div 
      onClick={() => onClick(item)}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border ${
            item.status === 'Claimed' 
              ? 'bg-green-100/90 text-green-700 border-green-200' 
              : 'bg-amber-100/90 text-amber-700 border-amber-200'
          }`}>
            {item.status}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 text-lg mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {item.name}
        </h3>
        
        <p className="text-slate-500 text-sm line-clamp-2 mb-3 flex-1">
          {item.description}
        </p>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center text-xs text-slate-400 gap-1.5">
            <Calendar size={14} />
            <span>{new Date(item.dateFound).toLocaleDateString()}</span>
          </div>
          
          {item.location && (
            <div className="flex items-center text-xs text-slate-400 gap-1.5">
              <MapPin size={14} />
              <span className="truncate">{item.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};