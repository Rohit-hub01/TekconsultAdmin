import { useState, useEffect, useCallback } from "react";
import { FolderTree, Plus, Edit2, Trash2, MoreHorizontal, Users, Loader2, AlertCircle, X, Stethoscope, Scale, Coins, Sparkles, BookOpen, Palette, Microscope, Info } from "lucide-react";
import CategoryDetailsModal from "@/components/categories/CategoryDetailsModal";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api, Category, SubCategory } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const categoryColors = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-accent",
  "bg-primary"
];

// Icon mapping for categories - maps category names/types to SVG icons
const categoryIconMap: Record<string, string> = {
  "Digital Marketers": "/assets/icons/Group.svg",
  "Counsellors": "/assets/icons/Counsellors.svg",
  "Fitness Coaches": "/assets/icons/FitnessCoaches.svg",
  "Health Consultants": "/assets/icons/HealthConsultants.svg",
  "Interior Consultants": "/assets/icons/InteriorConsultants.svg",
  "Lawyers": "/assets/icons/Lawyers.svg",
  "Startup Mentors": "/assets/icons/StartupMentors.svg",
};

// Get icon path for a category
const getCategoryIcon = (categoryName: string, iconName?: string): string | null => {
  // First try to match by category name
  if (categoryIconMap[categoryName]) {
    return categoryIconMap[categoryName];
  }
  // Then try to match by icon name if provided
  if (iconName && categoryIconMap[iconName]) {
    return categoryIconMap[iconName];
  }
  return null;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Dialog States

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    description: "",
    status: "Active",
    subcategories: []
  });
  const [newSubcategory, setNewSubcategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      setError("Failed to load categories.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const availableIcons = [
    { name: "Digital Marketers", path: "/assets/icons/Group.svg" },
    { name: "Counsellors", path: "/assets/icons/Counsellors.svg" },
    { name: "Fitness Coaches", path: "/assets/icons/FitnessCoaches.svg" },
    { name: "Health Consultants", path: "/assets/icons/HealthConsultants.svg" },
    { name: "Interior Consultants", path: "/assets/icons/InteriorConsultants.svg" },
    { name: "Lawyers", path: "/assets/icons/Lawyers.svg" },
    { name: "Startup Mentors", path: "/assets/icons/StartupMentors.svg" },
    { name: "FolderTree", icon: FolderTree }, // Fallback icon
  ];

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        status: category.status,
        icon: category.icon,
        subcategories: [...category.subcategories]
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        status: "Active",
        icon: "FolderTree",
        subcategories: []
      });
    }
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (id: string | number, currentStatus: Category['status']) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const isActive = newStatus === 'Active';

    // Optimistic Update
    const previousCategories = [...categories];
    setCategories(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

    try {
      await api.toggleCategoryStatus(id, isActive);
      toast({
        title: `Category ${newStatus}`,
        description: `The category status has been updated to ${newStatus}.`,
      });
    } catch (err) {
      setCategories(previousCategories);
      toast({
        title: "Update Failed",
        description: "Could not update category status.",
        variant: "destructive",
      });
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        const updated = await api.updateCategory(editingCategory.id, formData);
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast({ title: "Category Updated", description: "Changes have been saved successfully." });
      } else {
        const payload = {
          ...formData,
          consultantCount: 0,
        };
        const created = await api.createCategory(payload);
        setCategories(prev => [...prev, created]);
        toast({ title: "Category Created", description: "New category has been added successfully." });
      }
      setIsFormOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save category. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubcategory = () => {
    if (!newSubcategory.trim()) return;
    if (formData.subcategories?.some(s => s.name === newSubcategory.trim())) return;

    setFormData(prev => ({
      ...prev,
      subcategories: [...(prev.subcategories || []), { name: newSubcategory.trim(), description: "", consultantCount: 0 }]
    }));
    setNewSubcategory("");
  };

  const removeSubcategory = (subName: string) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories?.filter(s => s.name !== subName)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Category Management</h1>
          <p className="page-description">Manage consultation categories and subcategories</p>
        </div>
        <Button className="gap-2 bg-accent hover:bg-accent/90" onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading && categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading categories...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-destructive">
          <AlertCircle className="h-8 w-8 mb-4" />
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => fetchCategories()}>Retry</Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderTree className="h-8 w-8 mb-4 opacity-20" />
          <p>No categories found.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {categories.filter(c => c.status === "Active").length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold px-1">Active Categories</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.filter(c => c.status === "Active").map((category, index) => (
                  <Card key={category.id} className={cn(
                    "border-0 shadow-card transition-all hover:shadow-md h-full flex flex-col",
                    category.status === "Inactive" && "opacity-60"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category.name, category.icon) ? (
                            <img
                              src={getCategoryIcon(category.name, category.icon)!}
                              alt={category.name}
                              className="h-12 w-12 object-contain"
                            />
                          ) : (
                            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", categoryColors[index % categoryColors.length])}>
                              <FolderTree className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <CardTitle className="text-base truncate">{category.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={category.status === "Active" ? "default" : "secondary"} className={cn(
                                "text-xs",
                                category.status === "Active" ? "bg-success/15 text-success border-0" : ""
                              )}>
                                {category.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => {
                              setSelectedCategory(category);
                              setIsDetailsOpen(true);
                            }}>
                              <Info className="h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleToggleStatus(category.id, category.status)}>
                              {category.status === "Active" ? (
                                <><Trash2 className="h-4 w-4 text-warning" /> Disable</>
                              ) : (
                                <><Plus className="h-4 w-4 text-success" /> Enable</>
                              )}
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>

                      <div className="flex items-center gap-2 text-sm mt-auto pt-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{category.consultantCount}</span>
                        <span className="text-muted-foreground">consultants</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subcategories</p>
                        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                          {category.subcategories.length > 0 ? (
                            category.subcategories.map((sub) => (
                              <Badge key={sub.id || sub.name} variant="secondary" className="text-xs font-normal">
                                {sub.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No subcategories</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {categories.filter(c => c.status !== "Active").length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold px-1 text-muted-foreground">Inactive Categories</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.filter(c => c.status !== "Active").map((category, index) => (
                  <Card key={category.id} className={cn(
                    "border-0 shadow-card transition-all hover:shadow-md h-full flex flex-col opacity-60 hover:opacity-100"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(category.name, category.icon) ? (
                            <img
                              src={getCategoryIcon(category.name, category.icon)!}
                              alt={category.name}
                              className="h-12 w-12 object-contain grayscale"
                            />
                          ) : (
                            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center bg-gray-200")}>
                              <FolderTree className="h-6 w-6 text-gray-500" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <CardTitle className="text-base truncate text-muted-foreground">{category.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {category.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => {
                              setSelectedCategory(category);
                              setIsDetailsOpen(true);
                            }}>
                              <Info className="h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleToggleStatus(category.id, category.status)}>
                              <><Plus className="h-4 w-4 text-success" /> Enable</>
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>

                      <div className="flex items-center gap-2 text-sm mt-auto pt-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{category.consultantCount}</span>
                        <span className="text-muted-foreground">consultants</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subcategories</p>
                        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                          {category.subcategories.length > 0 ? (
                            category.subcategories.map((sub) => (
                              <Badge key={sub.id || sub.name} variant="secondary" className="text-xs font-normal">
                                {sub.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No subcategories</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] p-0 border-0 bg-transparent max-h-[90vh] overflow-hidden">
          <div className="bg-card w-full rounded-2xl shadow-premium overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50 flex items-center justify-between bg-muted/30 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {editingCategory ? "Edit Category" : "New Category"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {editingCategory ? "Update the details for this category." : "Add a new category for consultations."}
                </p>
              </div>

            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Category Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Wellness & Health"
                      className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-accent h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Icon</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableIcons.map(({ name, icon: Icon, path }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:bg-accent/5 h-16",
                            formData.icon === name
                              ? "border-accent bg-accent/5 text-accent shadow-sm"
                              : "border-transparent bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {path ? (
                            <img
                              src={path}
                              alt={name}
                              className="h-7 w-7 object-contain"
                            />
                          ) : Icon ? (
                            <Icon className="h-6 w-6" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Briefly describe what this category offers to users..."
                    className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-accent resize-none flex-1 min-h-[140px]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/50">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-accent" />
                  Subcategories
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubcategory();
                      }
                    }}
                    placeholder="Enter subcategory name..."
                    className="bg-background/50 border-0 focus-visible:ring-1 focus-visible:ring-accent flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSubcategory}
                    className="bg-background hover:bg-accent hover:text-white transition-all border-0 shadow-sm"
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] items-center">
                  {formData.subcategories && formData.subcategories.length > 0 ? (
                    formData.subcategories.map(sub => (
                      <Badge
                        key={sub.id || sub.name}
                        className="bg-background text-foreground border border-border/50 px-3 py-1 text-xs flex items-center gap-2 hover:border-accent transition-colors"
                      >
                        {sub.name}
                        <button
                          type="button"
                          onClick={() => removeSubcategory(sub.name)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">No subcategories added yet.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 h-11 sm:h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] h-11 sm:h-12 rounded-xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      <span className="hidden sm:inline">{editingCategory ? "Update Category" : "Create Category"}</span>
                      <span className="sm:hidden">{editingCategory ? "Update" : "Create"}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}


      {/* Category Details Modal */}
      {selectedCategory && (
        <CategoryDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          category={selectedCategory}
          onEdit={handleOpenForm}
        />
      )}
    </div>
  );
}
