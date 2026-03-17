import { Film, Music, Trophy, PlaySquare, Theater } from 'lucide-react';
import { categories } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, any> = {
  Film,
  Music,
  Trophy,
  PlaySquare,
  Theater,
};

export default function CategoryBar() {
  const navigate = useNavigate();

  const handleCategoryClick = (id: string) => {
    if (id === 'stream') {
      navigate('/stream');
    } else {
      navigate(`/category/${id}`);
    }
  };

  return (
    <div className="flex overflow-x-auto hide-scrollbar py-4 px-4 space-x-4">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon];
        return (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="flex flex-col items-center justify-center space-y-2 min-w-[72px] group"
          >
            <div className="w-14 h-14 rounded-full bg-vibe-card border border-white/5 flex items-center justify-center group-hover:bg-vibe-secondary transition-colors">
              <Icon className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
