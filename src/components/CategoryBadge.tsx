import { Category, CATEGORIES } from "@/types/expense";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
}

const categoryStyles: Record<Category, string> = {
  "eric-car": "bg-category-eric-car/15 text-category-eric-car border-category-eric-car/30",
  "leo-car": "bg-category-leo-car/15 text-category-leo-car border-category-leo-car/30",
  "drinks": "bg-category-drinks/15 text-category-drinks border-category-drinks/30",
  "general": "bg-category-general/15 text-category-general border-category-general/30",
};

export function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const { label, icon } = CATEGORIES[category];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
      categoryStyles[category],
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
