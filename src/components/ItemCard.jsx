import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, truncateText } from '../utils/formatters';

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%22200%22 y=%22160%22 font-family=%22sans-serif%22 font-size=%2218%22 fill=%22%239ca3af%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';

const ItemCard = ({ item }) => {
  const { id, title, category, type, location, date, imageUrl, status, description } = item;

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        <img
          src={imageUrl || PLACEHOLDER}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <StatusBadge status={type} />
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-blue-600 mb-1">{category}</p>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{truncateText(description, 90)}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{formatDate(date)}</span>
        </div>
        <Link
          to={`/item/${id}`}
          className="flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          View Details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default ItemCard;
