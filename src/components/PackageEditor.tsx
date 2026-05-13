import { useState, useEffect, DragEvent } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, Plus, Clock, Star, IndianRupee, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ImageUpload from "@/components/ImageUpload";
import PPTUpload from "@/components/PPTUpload";
import { TravelPackage, getTravelPackages, getTravelPackagesAsync, Route } from "@/lib/packages";
import { savePackage, deletePackage, savePackageOrder } from "@/lib/storage";

const difficultyOptions = ["Easy", "Moderate", "Difficult", "Extreme"];

export default function PackageEditor() {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<TravelPackage | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [draggedPackageId, setDraggedPackageId] = useState<string | null>(null);
  const [dragOverPackageId, setDragOverPackageId] = useState<string | null>(null);

  useEffect(() => { 
    getTravelPackagesAsync().then(setPackages).catch(() => {
      // Fallback to sync version
      setPackages(getTravelPackages());
    });
  }, []);

  const handleEdit = (pkg: TravelPackage) => { 
    // Deep clone to avoid mutating the original
    const editData = { 
      ...pkg,
      locations: [...pkg.locations],
      highlights: [...pkg.highlights],
      highlightImages: pkg.highlightImages ? [...pkg.highlightImages] : [],
      included: [...pkg.included],
      routes: pkg.routes ? pkg.routes.map(r => ({
        ...r,
        locations: [...r.locations],
        highlights: [...r.highlights],
      })) : [],
    };
    
    setEditingPackage(editData); 
    setIsEditDialogOpen(true); 
  };

  const handleAdd = () => {
    setEditingPackage({
      id: `pkg-${Date.now()}`, title: "", subtitle: "", category: "pilgrimage",
      duration: "", price: 0, rating: 0, reviews: 0, image: "", locations: [""],
      highlights: [""], bestTime: "", included: [""], status: "coming-soon", routes: [],
    });
    setIsAddDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingPackage) {
      try {
        await savePackage(editingPackage);
        // Reload packages from API
        const updated = await getTravelPackagesAsync().catch(() => getTravelPackages());
        setPackages(updated);
        setIsEditDialogOpen(false);
        setIsAddDialogOpen(false);
        setEditingPackage(null);
      } catch (error: any) {
        console.error('Error saving package:', error);
        console.error('Error response:', error.response?.data);
      }
    }
  };

  const handleDelete = async (id: string) => { 
    await deletePackage(id); 
    const updated = await getTravelPackagesAsync().catch(() => getTravelPackages());
    setPackages(updated);
  };

  const movePackage = (id: string, direction: "up" | "down") => {
    const idx = packages.findIndex(p => p.id === id);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || target < 0 || target >= packages.length) return;
    const updated = [...packages];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setPackages(updated);
    savePackageOrder(updated);
  };

  const handleDragStart = (id: string) => (e: DragEvent<HTMLDivElement>) => {
    setDraggedPackageId(id); 
    e.dataTransfer!.effectAllowed = "move"; 
    e.dataTransfer!.setData("text/plain", id);
    // Add visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "0.5";
    }
  };
  
  const handleDragOver = (id: string) => (e: DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    e.dataTransfer!.dropEffect = "move";
    setDragOverPackageId(id); 
  };
  
  const handleDrop = (id: string) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const sourceId = e.dataTransfer!.getData("text/plain") || draggedPackageId;
    if (!sourceId || sourceId === id) {
      setDraggedPackageId(null); 
      setDragOverPackageId(null);
      return;
    }
    const from = packages.findIndex(p => p.id === sourceId);
    const to = packages.findIndex(p => p.id === id);
    if (from === -1 || to === -1) {
      setDraggedPackageId(null); 
      setDragOverPackageId(null);
      return;
    }
    const updated = [...packages];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setPackages(updated); 
    savePackageOrder(updated);
    setDraggedPackageId(null); 
    setDragOverPackageId(null);
  };
  
  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => { 
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedPackageId(null); 
    setDragOverPackageId(null);
  };

  const upd = (field: keyof TravelPackage, value: any) =>
    editingPackage && setEditingPackage({ ...editingPackage, [field]: value });

  const updArr = (field: "locations" | "highlights" | "included", index: number, value: string) => {
    if (!editingPackage) return;
    const arr = [...(editingPackage[field] as string[])];
    arr[index] = value;
    setEditingPackage({ ...editingPackage, [field]: arr });
  };
  const addArr = (field: "locations" | "highlights" | "included") =>
    editingPackage && setEditingPackage({ ...editingPackage, [field]: [...(editingPackage[field] as string[]), ""] });
  const rmArr = (field: "locations" | "highlights" | "included", index: number) =>
    editingPackage && setEditingPackage({ ...editingPackage, [field]: (editingPackage[field] as string[]).filter((_, i) => i !== index) });

  const addRoute = () => {
    if (!editingPackage) return;
    const routes = editingPackage.routes || [];
    if (routes.length >= 2) return;
    setEditingPackage({ ...editingPackage, routes: [...routes, { id: `route-${Date.now()}`, name: `Route ${routes.length + 1}`, locations: [""], highlights: [""], bestTime: "", distance: editingPackage.distance }] });
  };
  const rmRoute = (i: number) => editingPackage?.routes && setEditingPackage({ ...editingPackage, routes: editingPackage.routes.filter((_, idx) => idx !== i) });
  const updRoute = (i: number, field: string, value: any) => {
    if (!editingPackage?.routes) return;
    const routes = [...editingPackage.routes];
    routes[i] = { ...routes[i], [field]: value };
    setEditingPackage({ ...editingPackage, routes });
  };
  const updRouteArr = (ri: number, field: "locations" | "highlights", idx: number, value: string) => {
    if (!editingPackage?.routes) return;
    const routes = [...editingPackage.routes];
    const arr = [...routes[ri][field]]; arr[idx] = value; routes[ri] = { ...routes[ri], [field]: arr };
    setEditingPackage({ ...editingPackage, routes });
  };
  const addRouteArr = (ri: number, field: "locations" | "highlights") => {
    if (!editingPackage?.routes) return;
    const routes = [...editingPackage.routes];
    routes[ri][field].push("");
    setEditingPackage({ ...editingPackage, routes });
  };
  const rmRouteArr = (ri: number, field: "locations" | "highlights", idx: number) => {
    if (!editingPackage?.routes) return;
    const routes = [...editingPackage.routes];
    routes[ri][field] = routes[ri][field].filter((_, i) => i !== idx);
    setEditingPackage({ ...editingPackage, routes });
  };

  const packageForm = editingPackage ? (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Title</Label><Input value={editingPackage.title} onChange={e => upd("title", e.target.value)} /></div>
        <div><Label>Subtitle</Label><Input value={editingPackage.subtitle} onChange={e => upd("subtitle", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={editingPackage.category} onValueChange={v => upd("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["pilgrimage","trek","heritage","nature","adventure"].map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Duration</Label><Input value={editingPackage.duration} onChange={e => upd("duration", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Price</Label><Input type="number" value={editingPackage.price} onChange={e => upd("price", parseInt(e.target.value)||0)} /></div>
        <div><Label>Rating</Label><Input type="number" step="0.1" value={editingPackage.rating} onChange={e => upd("rating", parseFloat(e.target.value)||0)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Reviews</Label><Input type="number" value={editingPackage.reviews} onChange={e => upd("reviews", parseInt(e.target.value)||0)} /></div>
        <div>
          <Label>Difficulty</Label>
          <Select value={editingPackage.difficulty||""} onValueChange={v => upd("difficulty", v||undefined)}>
            <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
            <SelectContent>{difficultyOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={editingPackage.status||"coming-soon"} onValueChange={v => upd("status", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="coming-soon">Coming Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ImageUpload value={editingPackage.image} onChange={v => upd("image", v)} label="Package Image" />
      {(["locations","highlights","included"] as const).map(field => (
        <div key={field}>
          <div className="flex items-center justify-between mb-2">
            <Label className="capitalize">{field}</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => addArr(field)} className="h-8 px-2"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-2">
            {(editingPackage[field] as string[]).map((val, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-6 text-sm text-muted-foreground mt-2.5">{i+1}.</span>
                {field === "highlights" 
                  ? <Textarea value={val} onChange={e => updArr(field, i, e.target.value)} placeholder={`${field} ${i+1}`} className="flex-1 min-h-[60px]" />
                  : <Input value={val} onChange={e => updArr(field, i, e.target.value)} placeholder={`${field} ${i+1}`} className="flex-1" />
                }
                <Button type="button" variant="outline" size="sm" onClick={() => rmArr(field, i)} disabled={(editingPackage[field] as string[]).length===1} className={`h-8 w-8 p-0 ${field==="highlights"?"self-start":""}`}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Highlight Images — multiple uploads */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Highlight Images</Label>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => upd("highlightImages", [...(editingPackage.highlightImages || []), ""])}
            className="h-8 px-2"
          >
            <Plus className="w-4 h-4" /> Add Image
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(editingPackage.highlightImages || [""]).map((img, i) => (
            <div key={i} className="relative">
              <ImageUpload
                value={img}
                onChange={v => {
                  const imgs = [...(editingPackage.highlightImages || [""])];
                  imgs[i] = v;
                  upd("highlightImages", imgs);
                }}
                label={`Image ${i + 1}`}
              />
              {(editingPackage.highlightImages || []).length > 1 && (
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => {
                    const imgs = (editingPackage.highlightImages || []).filter((_, idx) => idx !== i);
                    upd("highlightImages", imgs);
                  }}
                  className="absolute top-0 right-0 h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div><Label>Best Time</Label><Input value={editingPackage.bestTime} onChange={e => upd("bestTime", e.target.value)} /></div>
      <div><Label>Distance (km)</Label><Input type="number" value={editingPackage.distance||""} onChange={e => upd("distance", e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 800" /></div>
      <PPTUpload
        value={editingPackage.pptUrl ? { url: editingPackage.pptUrl, filename: editingPackage.pptFilename||"" } : null}
        onChange={v => { upd("pptUrl", v?.url||undefined); upd("pptFilename", v?.filename||undefined); }}
        label="Package PPT/PDF"
      />
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold">Routes (Optional - Max 2)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRoute} disabled={(editingPackage.routes?.length||0)>=2} className="h-8 px-2"><Plus className="w-4 h-4" /> Add Route</Button>
        </div>
        <div className="space-y-4">
          {editingPackage.routes?.map((route, ri) => (
            <div key={route.id} className="border border-dashed rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <Input value={route.name} onChange={e => updRoute(ri, "name", e.target.value)} placeholder={`Route ${ri+1} Name`} className="flex-1 mr-2" />
                <Button type="button" variant="outline" size="sm" onClick={() => rmRoute(ri)} className="h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
              </div>
              {(["locations","highlights"] as const).map(field => (
                <div key={field} className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground capitalize">{field}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => addRouteArr(ri, field)} className="h-6 px-2 text-xs"><Plus className="w-3 h-3" /></Button>
                  </div>
                  <div className="space-y-2">
                    {route[field].map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{idx+1}.</span>
                        {field === "highlights"
                          ? <Textarea value={val} onChange={e => updRouteArr(ri, field, idx, e.target.value)} placeholder={`${field} ${idx+1}`} className="flex-1 text-sm min-h-[50px]" />
                          : <Input value={val} onChange={e => updRouteArr(ri, field, idx, e.target.value)} placeholder={`${field} ${idx+1}`} className="flex-1 text-sm" />
                        }
                        <Button type="button" variant="outline" size="sm" onClick={() => rmRouteArr(ri, field, idx)} disabled={route[field].length===1} className={`h-6 w-6 p-0 ${field==="highlights"?"self-start mt-1":""}`}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Best Time</Label><Input value={route.bestTime} onChange={e => updRoute(ri, "bestTime", e.target.value)} placeholder="e.g., March to May" className="text-sm" /></div>
                <div><Label className="text-sm">Distance (km)</Label><Input type="number" value={route.distance||""} onChange={e => updRoute(ri, "distance", e.target.value ? parseInt(e.target.value) : undefined)} placeholder="e.g., 800" className="text-sm" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{packages.length} packages total</p>
        <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Package</Button>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg, index) => (
          <Card
            key={pkg.id}
            draggable
            onDragStart={handleDragStart(pkg.id)}
            onDragOver={handleDragOver(pkg.id)}
            onDrop={handleDrop(pkg.id)}
            onDragEnd={handleDragEnd}
            className={`relative transition-all cursor-move ${
              draggedPackageId === pkg.id 
                ? "opacity-50 border-primary/50" 
                : dragOverPackageId === pkg.id 
                ? "border-2 border-primary bg-primary/5 shadow-lg" 
                : "border-border hover:border-primary/50 hover:shadow-md"
            }`}
          >
            <CardHeader>
              <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm hover:bg-primary/10 hover:text-primary transition-colors">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 pl-14">
                  <CardTitle className="text-lg">{pkg.title}</CardTitle>
                  <p className="text-muted-foreground text-sm">{pkg.subtitle}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <Badge variant="outline">{pkg.category}</Badge>
                    <Badge variant={pkg.status==="available" ? "default" : "secondary"}>{pkg.status==="available" ? "Available" : "Coming Soon"}</Badge>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="w-3.5 h-3.5" />{pkg.duration}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><IndianRupee className="w-3.5 h-3.5" />{pkg.price.toLocaleString("en-IN")}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="w-3.5 h-3.5" />{pkg.rating}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => movePackage(pkg.id,"up")} disabled={index===0} title="Move up"><ChevronUp className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => movePackage(pkg.id,"down")} disabled={index===packages.length-1} title="Move down"><ChevronDown className="w-4 h-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)} title="Edit"><Edit className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" title="Delete"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Package</AlertDialogTitle>
                        <AlertDialogDescription>Delete "{pkg.title}"? This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(pkg.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="font-medium text-xs text-muted-foreground mb-0.5">Locations</p><p className="text-foreground">{pkg.locations.join(", ")}</p></div>
                <div><p className="font-medium text-xs text-muted-foreground mb-0.5">Highlights</p><p className="text-foreground line-clamp-1">{pkg.highlights.join(", ")}</p></div>
                <div><p className="font-medium text-xs text-muted-foreground mb-0.5">Included</p><p className="text-foreground line-clamp-1">{pkg.included.join(", ")}</p></div>
                <div><p className="font-medium text-xs text-muted-foreground mb-0.5">Best Time</p><p className="text-foreground">{pkg.bestTime}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Package</DialogTitle><DialogDescription>Update package details</DialogDescription></DialogHeader>
          {packageForm}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Package</DialogTitle><DialogDescription>Create a new package</DialogDescription></DialogHeader>
          {packageForm}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Add Package</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
