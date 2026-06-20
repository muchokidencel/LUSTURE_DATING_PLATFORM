import React, { useRef, useState } from 'react';
import { useUploadPhoto, useDeletePhoto } from '../hooks/useQueries';
import { compressImage } from '../utils/imageCompressor';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Star, Trash2, Loader2, Camera, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface Photo {
  url: string;
  public_id: string;
}

interface PhotoUploaderProps {
  photos: Photo[];
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ photos }) => {
  const uploadMutation = useUploadPhoto();
  const deleteMutation = useDeletePhoto();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingSlot(photos.length);

    try {
      const compressedBlob = await compressImage(file);
      await uploadMutation.mutateAsync(compressedBlob);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoadingSlot(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteMutation.mutateAsync(deletingId);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const renderSlot = (index: number) => {
    const photo = photos[index];
    const isLoading = loadingSlot === index;
    const isCover = index === 0;

    if (photo) {
      return (
        <div 
          key={photo.public_id}
          className={cn(
            "relative aspect-square rounded-xl overflow-hidden group bg-elevated border border-border shadow-[var(--shadow-card)]",
            isCover && "ring-2 ring-lustre-gold ring-offset-2 ring-offset-void"
          )}
          style={{ backgroundImage: `url(${photo.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {isCover && (
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white font-sans text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
              <Star size={8} className="fill-lustre-gold text-lustre-gold"  strokeWidth={1.5} />
              Cover Photo
            </div>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeletingId(photo.public_id)}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </Button>
        </div>
      );
    }

    return (
      <div 
        key={`empty-${index}`}
        className={cn(
          "relative aspect-square rounded-xl border border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer",
          isLoading 
            ? "border-lustre-purple bg-lustre-purple/5" 
            : "border-border-strong bg-elevated/30 hover:border-lustre-purple/40 hover:bg-elevated/50"
        )}
        onClick={() => !isLoading && index === photos.length && fileInputRef.current?.click()}
      >
        {isLoading ? (
          <Loader2 size={24} strokeWidth={1.5} className="text-lustre-purple animate-spin" />
        ) : (
          <>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              index === photos.length ? "bg-elevated text-lustre-purple border border-border" : "bg-transparent text-lustre-faint"
            )}>
              {index === photos.length ? <Plus size={20} strokeWidth={1.5} /> : <Camera size={20} strokeWidth={1.5} />}
            </div>
            <span className={cn(
              "font-sans text-[10px] font-semibold uppercase tracking-widest",
              index === photos.length ? "text-lustre-muted" : "text-lustre-faint"
            )}>
              Add Photo
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-sans text-xs font-semibold text-lustre-purple uppercase tracking-[0.2em]">Profile Visuals</h3>
        <span className="font-sans text-[10px] text-lustre-faint font-bold">{photos.length} / 6 uploaded</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[0, 1, 2, 3, 4, 5].map(index => renderSlot(index))}
      </div>

      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-sm p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-lustre-rose/10 rounded-full flex items-center justify-center border border-lustre-rose/20">
               <Trash2 size={28} strokeWidth={1.5} className="text-lustre-rose" />
            </div>
            
            <div className="space-y-2">
               <DialogTitle>Delete Photo?</DialogTitle>
               <DialogDescription>
                 This action will permanently remove this photo from your profile.
               </DialogDescription>
            </div>

            <div className="w-full flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeletingId(null)} className="flex-1 h-12 rounded-full font-sans">
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleDelete} 
                disabled={deleteMutation.isPending}
                className="flex-1 h-12 rounded-full font-sans bg-lustre-rose hover:opacity-90 transition-opacity"
              >
                {deleteMutation.isPending ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoUploader;
