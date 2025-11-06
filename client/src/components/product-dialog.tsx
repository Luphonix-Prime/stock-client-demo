import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X, Upload, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertProductSchema, type Product, type InsertProduct } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const [currentTab, setCurrentTab] = useState("basic");
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: product || {
      productName: "",
      sku: "",
      category: "",
      brand: "",
      description: "",
      color: "",
      size: "",
      fabric: "",
      pattern: "",
      gender: "",
      price: "0",
      costPrice: "",
      stockQuantity: 0,
      warehouse: "",
      productImage: "",
      galleryImages: [],
      isFeatured: false,
      launchDate: undefined,
      rating: "",
      tags: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: product ? "Product updated successfully" : "Product created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return await apiRequest("PATCH", `/api/products/${product?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    if (product) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const generateSKU = () => {
    const productName = form.getValues("productName");
    if (!productName || productName.trim() === "") {
      // Fallback to random SKU if no product name
      const sku = `SKU-${nanoid(8).toUpperCase()}`;
      form.setValue("sku", sku);
      return;
    }
    
    // Convert product name to SKU format: lowercase, replace spaces with hyphens
    const sku = productName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''); // Remove special characters except hyphens
    
    form.setValue("sku", sku);
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || [];
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter((_, i) => i !== index));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-product">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {product ? "Edit Product" : "Create New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
              <TabsTrigger value="variants" data-testid="tab-variants">Variants</TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing & Stock</TabsTrigger>
              <TabsTrigger value="media" data-testid="tab-media">Media & More</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  {...form.register("productName")}
                  placeholder="e.g., Men's Cotton T-Shirt"
                  data-testid="input-product-name"
                />
                {form.formState.errors.productName && (
                  <p className="text-sm text-destructive">{form.formState.errors.productName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Product Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    {...form.register("sku")}
                    placeholder="e.g., SKU-12345"
                    className="flex-1 font-mono"
                    data-testid="input-sku"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSKU}
                    data-testid="button-generate-sku"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                {form.formState.errors.sku && (
                  <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(value) => form.setValue("category", value)}
                  >
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                      <SelectItem value="Jeans">Jeans</SelectItem>
                      <SelectItem value="Dress">Dress</SelectItem>
                      <SelectItem value="Jacket">Jacket</SelectItem>
                      <SelectItem value="Shirt">Shirt</SelectItem>
                      <SelectItem value="Pants">Pants</SelectItem>
                      <SelectItem value="Skirt">Skirt</SelectItem>
                      <SelectItem value="Sweater">Sweater</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    {...form.register("brand")}
                    placeholder="e.g., Nike, Adidas"
                    data-testid="input-brand"
                  />
                  {form.formState.errors.brand && (
                    <p className="text-sm text-destructive">{form.formState.errors.brand.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Describe the product..."
                  rows={4}
                  data-testid="input-description"
                />
              </div>
            </TabsContent>

            <TabsContent value="variants" className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color *</Label>
                  <Select
                    value={form.watch("color")}
                    onValueChange={(value) => form.setValue("color", value)}
                  >
                    <SelectTrigger id="color" data-testid="select-color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Red">Red</SelectItem>
                      <SelectItem value="Blue">Blue</SelectItem>
                      <SelectItem value="Black">Black</SelectItem>
                      <SelectItem value="White">White</SelectItem>
                      <SelectItem value="Green">Green</SelectItem>
                      <SelectItem value="Yellow">Yellow</SelectItem>
                      <SelectItem value="Gray">Gray</SelectItem>
                      <SelectItem value="Pink">Pink</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.color && (
                    <p className="text-sm text-destructive">{form.formState.errors.color.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Select
                    value={form.watch("size")}
                    onValueChange={(value) => form.setValue("size", value)}
                  >
                    <SelectTrigger id="size" data-testid="select-size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.size && (
                    <p className="text-sm text-destructive">{form.formState.errors.size.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fabric">Fabric</Label>
                  <Select
                    value={form.watch("fabric") || ""}
                    onValueChange={(value) => form.setValue("fabric", value)}
                  >
                    <SelectTrigger id="fabric" data-testid="select-fabric">
                      <SelectValue placeholder="Select fabric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cotton">Cotton</SelectItem>
                      <SelectItem value="Polyester">Polyester</SelectItem>
                      <SelectItem value="Linen">Linen</SelectItem>
                      <SelectItem value="Silk">Silk</SelectItem>
                      <SelectItem value="Wool">Wool</SelectItem>
                      <SelectItem value="Denim">Denim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern</Label>
                  <Select
                    value={form.watch("pattern") || ""}
                    onValueChange={(value) => form.setValue("pattern", value)}
                  >
                    <SelectTrigger id="pattern" data-testid="select-pattern">
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solid">Solid</SelectItem>
                      <SelectItem value="Striped">Striped</SelectItem>
                      <SelectItem value="Checked">Checked</SelectItem>
                      <SelectItem value="Printed">Printed</SelectItem>
                      <SelectItem value="Floral">Floral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={form.watch("gender")}
                  onValueChange={(value) => form.setValue("gender", value)}
                >
                  <SelectTrigger id="gender" data-testid="select-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Unisex">Unisex</SelectItem>
                    <SelectItem value="Kids">Kids</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-destructive">{form.formState.errors.gender.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="price"
                      {...form.register("price")}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      data-testid="input-price"
                    />
                  </div>
                  {form.formState.errors.price && (
                    <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="costPrice"
                      {...form.register("costPrice")}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      data-testid="input-cost-price"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    {...form.register("stockQuantity", { valueAsNumber: true })}
                    type="number"
                    placeholder="0"
                    data-testid="input-stock-quantity"
                  />
                  {form.formState.errors.stockQuantity && (
                    <p className="text-sm text-destructive">{form.formState.errors.stockQuantity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <Input
                    id="warehouse"
                    {...form.register("warehouse")}
                    placeholder="e.g., Main Warehouse"
                    data-testid="input-warehouse"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label>Product Image</Label>
                {!form.watch("productImage") ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Click upload button to add a product image
                    </p>
                    <input
                      type="file"
                      id="product-image-upload"
                      accept="image/*"
                      className="hidden"
                      data-testid="input-file-product-image"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setIsUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append("image", file);

                          const response = await fetch("/api/upload/image", {
                            method: "POST",
                            body: formData,
                          });

                          if (!response.ok) throw new Error("Upload failed");

                          const data = await response.json();
                          form.setValue("productImage", data.url);
                          toast({
                            title: "Success",
                            description: "Image uploaded successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to upload image",
                            variant: "destructive",
                          });
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => document.getElementById("product-image-upload")?.click()}
                      data-testid="button-upload-image"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-pulse" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">
                      Or{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          const url = prompt("Enter image URL:");
                          if (url) form.setValue("productImage", url);
                        }}
                      >
                        enter URL
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg border overflow-hidden group">
                      <img
                        src={form.watch("productImage")!}
                        alt="Product preview"
                        className="w-full h-64 object-cover"
                        data-testid="img-product-preview"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            form.setValue("productImage", "");
                            const input = document.getElementById("product-image-upload") as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          data-testid="button-remove-image"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => document.getElementById("product-image-upload")?.click()}
                          data-testid="button-change-image"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change
                        </Button>
                      </div>
                    </div>
                    <input
                      type="file"
                      id="product-image-upload"
                      accept="image/*"
                      className="hidden"
                      data-testid="input-file-product-image"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setIsUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append("image", file);

                          const response = await fetch("/api/upload/image", {
                            method: "POST",
                            body: formData,
                          });

                          if (!response.ok) throw new Error("Upload failed");

                          const data = await response.json();
                          form.setValue("productImage", data.url);
                          toast({
                            title: "Success",
                            description: "Image uploaded successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to upload image",
                            variant: "destructive",
                          });
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Gallery Images (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  <input
                    type="file"
                    id="gallery-images-upload"
                    accept="image/*"
                    multiple
                    className="hidden"
                    data-testid="input-file-gallery-images"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;

                      setIsUploading(true);
                      try {
                        const formData = new FormData();
                        files.forEach((file) => {
                          formData.append("images", file);
                        });

                        const response = await fetch("/api/upload/images", {
                          method: "POST",
                          body: formData,
                        });

                        if (!response.ok) throw new Error("Upload failed");

                        const data = await response.json();
                        const currentGallery = form.watch("galleryImages") || [];
                        form.setValue("galleryImages", [...currentGallery, ...data.urls]);
                        toast({
                          title: "Success",
                          description: `${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully`,
                        });
                        
                        // Reset file input
                        e.target.value = "";
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to upload images",
                          variant: "destructive",
                        });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                  />
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Add multiple product images to gallery
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => document.getElementById("gallery-images-upload")?.click()}
                      data-testid="button-upload-gallery"
                    >
                      {isUploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-pulse" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {form.watch("galleryImages") && form.watch("galleryImages")!.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {form.watch("galleryImages")!.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg border overflow-hidden group"
                        data-testid={`gallery-image-${index}`}
                      >
                        <img
                          src={imageUrl}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const currentGallery = form.watch("galleryImages") || [];
                              form.setValue(
                                "galleryImages",
                                currentGallery.filter((_, i) => i !== index)
                              );
                            }}
                            data-testid={`button-remove-gallery-${index}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured">Featured Product</Label>
                  <p className="text-sm text-muted-foreground">Mark this product as featured</p>
                </div>
                <Switch
                  id="isFeatured"
                  checked={form.watch("isFeatured") || false}
                  onCheckedChange={(checked) => form.setValue("isFeatured", checked)}
                  data-testid="switch-featured"
                />
              </div>

              <div className="space-y-2">
                <Label>Launch Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("launchDate") && "text-muted-foreground"
                      )}
                      data-testid="button-launch-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("launchDate") ? (
                        format(new Date(form.watch("launchDate")!), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch("launchDate") ? new Date(form.watch("launchDate")!) : undefined}
                      onSelect={(date) => form.setValue("launchDate", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  {...form.register("rating")}
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="0.0 - 5.0"
                  data-testid="input-rating"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    data-testid="input-tag"
                  />
                  <Button type="button" variant="outline" onClick={addTag} data-testid="button-add-tag">
                    Add
                  </Button>
                </div>
                {form.watch("tags") && form.watch("tags")!.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.watch("tags")!.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="pl-3 pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-2 rounded-full hover:bg-muted p-0.5"
                          data-testid={`button-remove-tag-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
