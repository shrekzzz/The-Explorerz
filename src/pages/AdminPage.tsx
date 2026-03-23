import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, Plus, MapPin, Clock, Star, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Navbar from "@/components/Navbar";
import { TravelPackage, getTravelPackages } from "@/lib/packages";
import { savePackage, deletePackage } from "@/lib/storage";

const difficultyOptions = ["Easy", "Moderate", "Difficult", "Extreme"];

export default function AdminPage() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<TravelPackage | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    setPackages(getTravelPackages());
  }, []);

  const handleEdit = (pkg: TravelPackage) => {
    setEditingPackage({ ...pkg });
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    const newPackage: TravelPackage = {
      id: `pkg-${Date.now()}`,
      title: "",
      subtitle: "",
      category: "pilgrimage",
      duration: "",
      price: 0,
      rating: 0,
      reviews: 0,
      image: "",
      locations: [],
      highlights: [],
      bestTime: "",
      included: [],
    };
    setEditingPackage(newPackage);
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    if (editingPackage) {
      savePackage(editingPackage);
      setPackages(getTravelPackages());
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      setEditingPackage(null);
    }
  };

  const handleDelete = (id: string) => {
    deletePackage(id);
    setPackages(getTravelPackages());
  };

  const updateEditingPackage = (field: keyof TravelPackage, value: any) => {
    if (editingPackage) {
      setEditingPackage({ ...editingPackage, [field]: value });
    }
  };

  const updateArrayField = (field: "locations" | "highlights" | "included", value: string) => {
    if (editingPackage) {
      const current = editingPackage[field] as string[];
      const updated = value.split(",").map(s => s.trim()).filter(s => s);
      setEditingPackage({ ...editingPackage, [field]: updated });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto max-w-6xl px-4 pt-28 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel - Packages</h1>
            <p className="text-muted-foreground">Manage travel packages</p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Package
          </Button>
        </div>

        <div className="grid gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{pkg.title}</CardTitle>
                    <p className="text-muted-foreground">{pkg.subtitle}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">{pkg.category}</Badge>
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4" /> {pkg.duration}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <IndianRupee className="w-4 h-4" /> {pkg.price.toLocaleString("en-IN")}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4" /> {pkg.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Package</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{pkg.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(pkg.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Locations</Label>
                    <p className="text-sm text-muted-foreground">{pkg.locations.join(", ")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Highlights</Label>
                    <p className="text-sm text-muted-foreground">{pkg.highlights.join(", ")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Included</Label>
                    <p className="text-sm text-muted-foreground">{pkg.included.join(", ")}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Best Time</Label>
                    <p className="text-sm text-muted-foreground">{pkg.bestTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Package</DialogTitle>
              <DialogDescription>Update package details</DialogDescription>
            </DialogHeader>
            {editingPackage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editingPackage.title}
                      onChange={(e) => updateEditingPackage("title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={editingPackage.subtitle}
                      onChange={(e) => updateEditingPackage("subtitle", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editingPackage.category}
                      onValueChange={(value) => updateEditingPackage("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pilgrimage">Pilgrimage</SelectItem>
                        <SelectItem value="trek">Trek</SelectItem>
                        <SelectItem value="heritage">Heritage</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={editingPackage.duration}
                      onChange={(e) => updateEditingPackage("duration", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editingPackage.price}
                      onChange={(e) => updateEditingPackage("price", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      value={editingPackage.rating}
                      onChange={(e) => updateEditingPackage("rating", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reviews">Reviews</Label>
                    <Input
                      id="reviews"
                      type="number"
                      value={editingPackage.reviews}
                      onChange={(e) => updateEditingPackage("reviews", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={editingPackage.difficulty || ""}
                      onValueChange={(value) => updateEditingPackage("difficulty", value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={editingPackage.image}
                    onChange={(e) => updateEditingPackage("image", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="locations">Locations (comma-separated)</Label>
                  <Input
                    id="locations"
                    value={editingPackage.locations.join(", ")}
                    onChange={(e) => updateArrayField("locations", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="highlights">Highlights (comma-separated)</Label>
                  <Textarea
                    id="highlights"
                    value={editingPackage.highlights.join(", ")}
                    onChange={(e) => updateArrayField("highlights", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="included">Included (comma-separated)</Label>
                  <Input
                    id="included"
                    value={editingPackage.included.join(", ")}
                    onChange={(e) => updateArrayField("included", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bestTime">Best Time</Label>
                  <Input
                    id="bestTime"
                    value={editingPackage.bestTime}
                    onChange={(e) => updateEditingPackage("bestTime", e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Package</DialogTitle>
              <DialogDescription>Create a new package</DialogDescription>
            </DialogHeader>
            {editingPackage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-title">Title</Label>
                    <Input
                      id="add-title"
                      value={editingPackage.title}
                      onChange={(e) => updateEditingPackage("title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-subtitle">Subtitle</Label>
                    <Input
                      id="add-subtitle"
                      value={editingPackage.subtitle}
                      onChange={(e) => updateEditingPackage("subtitle", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-category">Category</Label>
                    <Select
                      value={editingPackage.category}
                      onValueChange={(value) => updateEditingPackage("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pilgrimage">Pilgrimage</SelectItem>
                        <SelectItem value="trek">Trek</SelectItem>
                        <SelectItem value="heritage">Heritage</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                        <SelectItem value="adventure">Adventure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="add-duration">Duration</Label>
                    <Input
                      id="add-duration"
                      value={editingPackage.duration}
                      onChange={(e) => updateEditingPackage("duration", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-price">Price</Label>
                    <Input
                      id="add-price"
                      type="number"
                      value={editingPackage.price}
                      onChange={(e) => updateEditingPackage("price", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-rating">Rating</Label>
                    <Input
                      id="add-rating"
                      type="number"
                      step="0.1"
                      value={editingPackage.rating}
                      onChange={(e) => updateEditingPackage("rating", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-reviews">Reviews</Label>
                    <Input
                      id="add-reviews"
                      type="number"
                      value={editingPackage.reviews}
                      onChange={(e) => updateEditingPackage("reviews", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-difficulty">Difficulty</Label>
                    <Select
                      value={editingPackage.difficulty || ""}
                      onValueChange={(value) => updateEditingPackage("difficulty", value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficultyOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="add-image">Image URL</Label>
                  <Input
                    id="add-image"
                    value={editingPackage.image}
                    onChange={(e) => updateEditingPackage("image", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="add-locations">Locations (comma-separated)</Label>
                  <Input
                    id="add-locations"
                    value={editingPackage.locations.join(", ")}
                    onChange={(e) => updateArrayField("locations", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="add-highlights">Highlights (comma-separated)</Label>
                  <Textarea
                    id="add-highlights"
                    value={editingPackage.highlights.join(", ")}
                    onChange={(e) => updateArrayField("highlights", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="add-included">Included (comma-separated)</Label>
                  <Input
                    id="add-included"
                    value={editingPackage.included.join(", ")}
                    onChange={(e) => updateArrayField("included", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="add-bestTime">Best Time</Label>
                  <Input
                    id="add-bestTime"
                    value={editingPackage.bestTime}
                    onChange={(e) => updateEditingPackage("bestTime", e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Add Package</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}