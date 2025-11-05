'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, ShieldX } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

interface AccountModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AccountModal({ isOpen, onOpenChange }: AccountModalProps) {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // State for profile picture
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Check if any form data has changed
  const hasChanges = (isLoaded && user) ? 
    (firstName.trim() !== (user.firstName || '')) ||
    (lastName.trim() !== (user.lastName || '')) ||
    !!imageFile // `!!` turns the file (or null) into a boolean
    : false;

  // This effect syncs the form state with the user data from Clerk
  useEffect(() => {
    if (isLoaded && user && isOpen) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      // Reset image previews when modal is re-opened
      setImagePreview(null);
      setImageFile(null);
    }
  }, [isLoaded, user, isOpen]);

  // Handle new image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("File is too large. Please select an image under 2MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type. Please select an image.");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Clear the input value to allow re-uploading the same file
    if(e.target) e.target.value = "";
  };

  // Handle form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !user || !hasChanges) {
      return;
    }

    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [];

      // Check if name needs updating
      if (
        firstName.trim() !== (user.firstName || '') ||
        lastName.trim() !== (user.lastName || '')
      ) {
        promises.push(
          user.update({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          })
        );
      }

      // Check if image needs updating
      if (imageFile) {
        promises.push(
          user.setProfileImage({
            file: imageFile,
          })
        );
      }

      await Promise.all(promises);
      
      toast.success("Profile updated successfully!");
      onOpenChange(false); // Close the modal on success

    } catch (err: any) {
      console.error("Failed to update profile", err);
      const errorMessage = err.errors?.[0]?.message || "An error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await user.delete();
      toast.success("Account deleted successfully.");
      onOpenChange(false);
      // Clerk's hooks will handle redirecting the user
    } catch (err: any) {
      console.error("Failed to delete account", err);
      const errorMessage = err.errors?.[0]?.message || "An error occurred.";
      toast.error(errorMessage);
      setIsDeleting(false); // Only reset on error
    }
  }

  // Prevent closing the dialog while loading
  const handleOpenChange = (open: boolean) => {
    if (isLoading || isDeleting) return;
    onOpenChange(open);
  };
  
  const getInitials = () => {
    const f = user?.firstName || "";
    const l = user?.lastName || "";
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || "U";
  };

  // --- THIS IS THE FIX ---
  // Safely check the linkedTo array. Use `?.[0]` to safely access the first element.
  // If it's missing (i.e., email/password user), default to 'email'.
  const authProvider = user?.primaryEmailAddress?.linkedTo?.[0]?.type || 'email';
  // --- END OF FIX ---

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Manage your profile, security, and preferences.
            </DialogDescription>
          </DialogHeader>

          {!isLoaded ? (
            <div className="py-4">
              <div className="flex items-center space-x-4 mb-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="grid gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <form onSubmit={handleSave}>
                  <div className="grid gap-4 py-4">
                    {/* Profile Picture */}
                    <div className="grid gap-2">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={imagePreview || user?.imageUrl} />
                            <AvatarFallback className="text-3xl">
                              {getInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-0 h-full w-full rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                          >
                            <Camera className="h-6 w-6" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          Change
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>

                    {/* First Name Input */}
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g., Patrick"
                        disabled={isLoading}
                      />
                    </div>
                    {/* Last Name Input */}
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g., Pato"
                        disabled={isLoading}
                      />
                    </div>
                    {/* Email (Read-only) */}
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.emailAddresses[0]?.emailAddress || ''}
                        disabled
                        readOnly
                        className="text-muted-foreground"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !isLoaded || !hasChanges}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save changes
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security">
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label>Authentication</Label>
                    {/* Use the new safe `authProvider` variable here */}
                    <p className="text-sm text-muted-foreground">
                      {authProvider === 'email'
                        ? 'You are signed in with Email & Password.'
                        : `You are signed in via ${authProvider.charAt(0).toUpperCase() + authProvider.slice(1)}. Manage your password through that provider.`
                      }
                    </p>
                  </div>
                  
                  <Separator />

                  {/* Danger Zone: Must wrap the trigger AND content in one <AlertDialog> */}
                  <AlertDialog>
                    <div className="space-y-3 rounded-lg border border-destructive p-4">
                      <div className="flex items-center gap-2">
                        <ShieldX className="h-5 w-5 text-destructive" />
                        <h4 className="font-semibold text-destructive">Danger Zone</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Deleting your account is permanent and cannot be undone. All your folders, notes, and flashcards will be lost.
                      </p>
                      
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                    </div>
                    
                    {/* This content is now tied to the trigger above */}
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Yes, delete my account"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog> {/* End of AlertDialog */}

                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}