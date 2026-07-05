'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Layers, Package, Plus, Pencil, Trash2, Loader2, FolderPlus } from 'lucide-react';

const api = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...opts?.headers }, ...opts });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CategoryForm {
  name: string;
  slug: string;
  icon: string;
  description: string;
  parentId: string;
  sortOrder: string;
}

const emptyForm: CategoryForm = { name: '', slug: '', icon: '', description: '', parentId: '', sortOrder: '0' };

export default function AdminCategories({ token }: { token: string }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await api(`/api/admin/categories?token=${token}`);
      setCategories(data || []);
    } catch (e: any) { 
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchCategories());
  }, [token]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: autoSlug ? slugify(name) : prev.slug,
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAutoSlug(true);
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || '',
      description: cat.description || '',
      parentId: cat.parentId || '',
      sortOrder: String(cat.sortOrder ?? 0),
    });
    setAutoSlug(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Category name is required');
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        icon: form.icon.trim() || null,
        description: form.description.trim() || null,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingId) {
        await api(`/api/admin/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'x-token': token },
          body: JSON.stringify(payload),
        });
        toast.success('Category updated');
      } else {
        await api('/api/admin/categories', {
          method: 'POST',
          headers: { 'x-token': token },
          body: JSON.stringify(payload),
        });
        toast.success('Category created');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (e: any) { 
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/categories/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'x-token': token },
      });
      toast.success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (e: any) { 
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (cat: any) => {
    try {
      await api(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'x-token': token },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      toast.success(`Category ${cat.isActive ? 'deactivated' : 'activated'}`);
      fetchCategories();
    } catch (e: any) { 
      toast.error(e.message);
    }
  };

  // Parent options (exclude current editing item to prevent self-reference)
  const parentOptions = categories.filter(c => c.id !== editingId);

  const filtered = search
    ? categories.filter((c: any) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.slug?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const totalPrompts = categories.reduce((s: number, c: any) => s + (c.promptCount || 0), 0);
  const activeCount = categories.filter(c => c.isActive).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {categories.length} categories ({activeCount} active) · {totalPrompts} total prompts
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            size="sm"
            className="bg-neon-blue hover:bg-neon-blue text-white gap-1.5 shrink-0"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-muted-foreground">
          <Layers className="h-10 w-10 mb-2" />
          <p className="font-medium">No categories found</p>
          <p className="text-sm mt-1">Create your first category to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cat: any, i: number) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow group relative">
                {/* Status indicator */}
                {!cat.isActive && (
                  <Badge variant="secondary" className="absolute top-3 right-3 text-[10px] bg-gray-100 text-gray-500">
                    Inactive
                  </Badge>
                )}

                {/* Icon + Slug row */}
                <div className="flex items-start justify-between mb-3 pr-16">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-lg shrink-0">
                    {cat.icon || '📁'}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {cat.slug}
                  </span>
                </div>

                {/* Name */}
                <h3
                  className="font-semibold text-sm mb-1 group-hover:text-neon-blue transition-colors cursor-pointer"
                  onClick={() => openEdit(cat)}
                >
                  {cat.name}
                </h3>

                {/* Description */}
                {cat.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{cat.description}</p>
                )}

                {/* Parent */}
                {cat.parentId && (
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Parent: {categories.find(p => p.id === cat.parentId)?.name || cat.parentId}
                  </p>
                )}

                {/* Prompt count + sort order */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>{cat.promptCount || 0} prompts</span>
                  </div>
                  {cat.sortOrder > 0 && (
                    <span className="text-[10px] text-muted-foreground">Order: {cat.sortOrder}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs gap-1 text-neon-blue hover:text-neon-blue hover:bg-blue-50"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>

                {/* Active toggle — bottom right corner */}
                <div className="absolute bottom-3 right-3">
                  <Switch
                    checked={cat.isActive}
                    onCheckedChange={() => toggleActive(cat)}
                    className="data-[state=checked]:bg-neon-blue"
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Name */}
            <div>
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Creative Writing"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="cat-slug">Slug</Label>
                {!editingId && (
                  <button
                    type="button"
                    className="text-[10px] text-neon-blue hover:underline"
                    onClick={() => setAutoSlug(!autoSlug)}
                  >
                    {autoSlug ? 'manual' : 'auto'}
                  </button>
                )}
              </div>
              <Input
                id="cat-slug"
                placeholder="creative-writing"
                value={form.slug}
                onChange={e => {
                  setAutoSlug(false);
                  setForm(prev => ({ ...prev, slug: e.target.value }));
                }}
                className="mt-1"
              />
            </div>

            {/* Icon */}
            <div>
              <Label htmlFor="cat-icon">Icon (emoji)</Label>
              <Input
                id="cat-icon"
                placeholder="📁 or any emoji"
                value={form.icon}
                onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                className="mt-1"
                maxLength={4}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                placeholder="Brief description of this category..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Parent + Sort Order */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Parent</Label>
                <Select
                  value={form.parentId}
                  onValueChange={v => setForm(prev => ({ ...prev, parentId: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (top-level)</SelectItem>
                    {parentOptions.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.icon || '📁'} {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cat-order">Sort Order</Label>
                <Input
                  id="cat-order"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={e => setForm(prev => ({ ...prev, sortOrder: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="w-full bg-neon-blue hover:bg-neon-blue text-white"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The category will be permanently removed.
              {deleteTarget?.promptCount > 0 && (
                <span className="block mt-2 font-medium text-red-500">
                  ⚠️ This category has {deleteTarget.promptCount} prompt(s). You must remove or reassign them before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (deleteTarget?.promptCount > 0)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}