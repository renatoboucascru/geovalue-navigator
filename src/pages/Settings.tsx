import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  LogOut,
  ChevronRight,
  Camera,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Settings() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({ display_name: displayName });
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
    }
    setIsSaving(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Account</h2>
          <p className="text-muted-foreground mb-6">
            Sign in to manage your profile, preferences, and notifications.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="font-semibold text-foreground mb-4">Profile</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
                <User className="h-10 w-10 text-accent-foreground" />
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {profile?.display_name || 'No name set'}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-12 px-4 bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving || displayName === profile?.display_name}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors',
                displayName !== profile?.display_name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed'
              )}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.section>

        {/* Preferences */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <h2 className="font-semibold text-foreground p-6 pb-4">Preferences</h2>
          
          <div className="divide-y divide-border">
            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Notifications</p>
                  <p className="text-sm text-muted-foreground">Manage alert preferences</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Appearance</p>
                  <p className="text-sm text-muted-foreground">Theme and display options</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Privacy & Security</p>
                  <p className="text-sm text-muted-foreground">Password and data settings</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </motion.section>

        {/* Account Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-4 bg-signal-red/10 text-signal-red rounded-2xl font-medium hover:bg-signal-red/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </motion.section>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>GeoValue Screener v2.0</p>
          <p className="mt-1">Not financial advice. For informational purposes only.</p>
        </div>
      </div>
    </div>
  );
}
