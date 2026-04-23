import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Category } from '@/services/api';

interface CategoryCardProps {
  category: Category;
  compact?: boolean;
}

const CategoryCard = ({ category, compact = false }: CategoryCardProps) => {
  // Icon mapping for categories - maps category names to SVG icons
  const categoryIconMap: Record<string, string> = {
    'Digital Marketers': '/assets/icons/Group.svg',
    'Counsellors': '/assets/icons/Counsellors.svg',
    'Fitness Coaches': '/assets/icons/FitnessCoaches.svg',
    'Health Consultants': '/assets/icons/HealthConsultants.svg',
    'Interior Consultant': '/assets/icons/InteriorConsultants.svg',
    'Lawyers': '/assets/icons/Lawyers.svg',
    'Startup Mentors': '/assets/icons/StartupMentors.svg',
  };

  // Color mapping for categories
  const categoryColorMap: Record<string, string> = {
    'Digital Marketers': 'bg-chart-1',
    'Counsellors': 'bg-chart-2',
    'Fitness Coaches': 'bg-chart-3',
    'Health Consultants': 'bg-chart-4',
    'Interior Consultant': 'bg-chart-5',
    'Lawyers': 'bg-accent',
    'Startup Mentors': 'bg-primary',
  };

  // Get icon path for a category
  const getIcon = (categoryName: string): string | null => {
    return categoryIconMap[categoryName] || null;
  };

  // Get color for a category
  const getColorClass = (categoryName: string): string => {
    return categoryColorMap[categoryName] || 'bg-primary';
  };

  const icon = getIcon(category.name);
  const colorClass = getColorClass(category.name);

  return (
    <Link
      to={`/user/explore?category=${category.categoryId}`}
      className={cn(
        'group flex items-center gap-4 bg-card rounded-2xl border border-border p-4 transition-all hover:shadow-lg hover:border-primary/50 hover:bg-muted/30',
        compact ? 'min-w-[160px]' : 'w-full'
      )}
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-sm group-hover:scale-110', colorClass)}>
        {icon ? (
          <img src={icon} alt={category.name} className="w-6 h-6 object-contain" />
        ) : (
          <span className="text-lg font-bold text-white">{category.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="text-left">
        <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors leading-snug">
          {category.name}
        </h3>
        {!compact && (
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">
            {category.subCategories?.length || 0} Sub-categories
          </p>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
