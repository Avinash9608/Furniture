import React, { useState, useEffect } from "react";
import { getLocalCategories } from "../../utils/defaultData";
import { useDispatch } from "react-redux";
import { createProduct } from "../../actions/productActions";
import FileUpload from "../../components/FileUpload";
import Button from "../../components/Button";

const ProductForm = ({ onClose = () => {}, ...props }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [featured, setFeatured] = useState(false);
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    height: "",
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setCategories(getLocalCategories());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("stock", stock);
    formData.append("featured", featured);
    formData.append("material", material);
    formData.append("color", color);
    formData.append("dimensions", JSON.stringify(dimensions));

    // Append each image file
    images.forEach((image) => {
      if (image instanceof File) {
        formData.append("images", image);
      }
    });

    try {
      await dispatch(createProduct(formData));
      onClose();
    } catch (error) {
      console.error("Error creating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Collapsible UI state
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border rounded-lg shadow-lg bg-white dark:bg-gray-900 p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setCollapsed((c) => !c)}>
        <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">{collapsed ? 'Show' : 'Add New Product'}</h2>
        <button
          type="button"
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 text-2xl font-bold focus:outline-none"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '+' : '–'}
        </button>
      </div>
      {!collapsed && (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 animate-fade-in">
          <div>
            <label className="block font-medium mb-1">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a category</option>
              {Array.from(new Set(categories.map(cat => cat.name))).map(uniqueName => {
                const cat = categories.find(c => c.name === uniqueName);
                return (
                  <option key={cat._id} value={cat._id}>
                    {uniqueName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              id="featured"
              className="accent-amber-600 h-4 w-4"
            />
            <label htmlFor="featured" className="font-medium">Featured Product</label>
          </div>

          <div>
            <label className="block font-medium mb-1">Material</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Dimensions (cm)</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Length"
                value={dimensions.length}
                onChange={(e) =>
                  setDimensions({ ...dimensions, length: e.target.value })
                }
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="number"
                placeholder="Width"
                value={dimensions.width}
                onChange={(e) =>
                  setDimensions({ ...dimensions, width: e.target.value })
                }
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="number"
                placeholder="Height"
                value={dimensions.height}
                onChange={(e) =>
                  setDimensions({ ...dimensions, height: e.target.value })
                }
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Images</label>
            <FileUpload multiple maxFiles={5} value={images} onChange={setImages} />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProductForm;
