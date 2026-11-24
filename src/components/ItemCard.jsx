import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ItemImage from './ItemImage';
import { formatDate, truncateText } from '../utils/formatters';

const ItemCard = ({ item }) => {
  const { id, title, category, type, location, date, imageUrl, status, description } = item;

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <ItemImage
          src={imageUrl || item.image}
          alt={title}
          className="w-full h-full"
          imgClassName="group-hover:scale-105 transition-transform duration-300"
          fit="cover"
        />
        <div className="absolute top-2 left-2 flex gap-1.5 z-20">
          <StatusBadge status={type} />
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">{category}</p>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 text-base">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{truncateText(description, 90)}</p>
          )}
          {location && location !== 'Not specified' && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(date)}</span>
          </div>
        </div>
        <Link
          to={`/item/${id}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors mt-auto"
        >
          View Details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default ItemCard;
