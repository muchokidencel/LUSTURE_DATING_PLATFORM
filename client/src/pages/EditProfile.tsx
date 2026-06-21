import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useUpdateProfile } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import PhotoUploader from '../components/PhotoUploader';
import { Switch } from '../components/ui/switch';
import { ArrowLeft, User, MessageCircle, AtSign, Loader2, Settings, ShieldCheck, Wallet, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { getErrorMessage } from '../lib/errors';

interface ProfileData {
  fullName?: string;
  bio?: string;
  idealSunday?: string;
  age?: number;
  gender?: string;
  location?: string;
  city?: string;
  whatsapp?: string;
  instagram?: string;
  ghostMode?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  intent?: string;
  preferences?: {
    interestedInGenders?: string[];
    minAge?: number;
    maxAge?: number;
    maxDistanceKm?: number;
    intentPreference?: string;
  };
}

function buildFormData(profile: ProfileData | undefined) {
  if (!profile) {
    return {
      fullName: '',
      bio: '',
      idealSunday: '',
      age: '',
      gender: '',
      city: '',
      whatsapp: '',
      instagram: '',
      interestedIn: 'Everyone',
      minAge: 18,
      maxAge: 50,
      distance: 50,
      ghostMode: false,
      latitude: null as number | null,
      longitude: null as number | null,
      intent: 'unspecified',
      intentPreference: 'unspecified',
    };
  }

  const prefGender = profile.preferences?.interestedInGenders?.[0] || 'everyone';
  const genderLabelMap: Record<string, string> = {
    'male': 'Men',
    'female': 'Women',
    'everyone': 'Everyone'
  };

  return {
    fullName: profile.fullName || '',
    bio: profile.bio || '',
    idealSunday: profile.idealSunday || '',
    age: profile.age?.toString() || '',
    gender: profile.gender || '',
    city: profile.location || profile.city || '',
    whatsapp: profile.whatsapp || '',
    instagram: profile.instagram || '',
    interestedIn: genderLabelMap[prefGender] || 'Everyone',
    minAge: profile.preferences?.minAge || 18,
    maxAge: profile.preferences?.maxAge || 50,
    distance: profile.preferences?.maxDistanceKm || 50,
    ghostMode: profile.ghostMode || false,
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    intent: profile.intent || 'unspecified',
    intentPreference: profile.preferences?.intentPreference || 'unspecified',
  };
}

export default function EditProfile() {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(() => buildFormData(profile));

  // Re-seed the editable form if the profile reference changes after mount
  // (e.g. the query resolves asynchronously, or later refetches). Adjusting
  // state during render, rather than in an effect, per React's guidance for
  // "adjusting state when a prop/state value changes".
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setFormData(buildFormData(profile));
    }
  }

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
        }));
        setLocating(false);
      },
      (error) => {
        console.error("Error fetching geolocation:", error);
        setLocationError(true);
        setFormData(prev => ({
          ...prev,
          latitude: null,
          longitude: null,
        }));
        alert("Failed to access your location. Please check browser permissions and enter your City manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 99)) {
      setError('Age must be between 18 and 99.');
      return;
    }

    try {
      console.log(`[INTEGRATION:PROFILE_UPDATE] Sending updates for user`);

      const interestMap: Record<string, string> = {
        'Men': 'Male',
        'Women': 'Female',
        'Everyone': 'Any'
      };

      const payload: {
        displayName: string;
        bio: string;
        idealSunday: string;
        city: string;
        whatsapp: string;
        instagram: string;
        ghostMode: boolean;
        latitude: number | null;
        longitude: number | null;
        intent: string;
        matchPreferences: {
          gender: string;
          ageRange: { min: number; max: number };
          maxDistanceKm: number;
          intent: string;
        };
        age?: number;
        gender?: string;
      } = {
        displayName: formData.fullName,
        bio: formData.bio,
        idealSunday: formData.idealSunday,
        city: formData.city,
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        ghostMode: formData.ghostMode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        intent: formData.intent,
        matchPreferences: {
          gender: interestMap[formData.interestedIn] || 'Any',
          ageRange: { min: formData.minAge, max: formData.maxAge },
          maxDistanceKm: formData.distance,
          intent: formData.intentPreference
        }
      };

      // Only include age if it is a valid non-empty string to avoid null-parsing errors in Zod
      if (formData.age) {
        payload.age = parseInt(formData.age);
      } else {
        payload.age = undefined;
      }

      // Only include gender if it is set to avoid sending an invalid empty string to Zod enum validation
      if (formData.gender) {
        payload.gender = formData.gender;
      } else {
        payload.gender = undefined;
      }

      await updateProfileMutation.mutateAsync(payload);
      navigate('/profile');
    } catch (err) {
      console.error('[INTEGRATION:PROFILE_UPDATE] Failed to update profile:', err);
      setError(getErrorMessage(err, 'Failed to save changes. Please try again.'));
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <Loader2 size={48} strokeWidth={1.5} className="text-lustre-purple animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-void text-lustre-text pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-void/90 backdrop-blur-md border-b border-border-subtle h-20 flex items-center px-4 md:px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="rounded-full text-lustre-muted hover:text-lustre-text">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </Button>
            <h1 className="font-garamond text-lg md:text-2xl font-medium">Edit Profile</h1>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={updateProfileMutation.isPending}
            className="rounded-full px-4 md:px-8 h-10 font-sans font-semibold text-xs md:text-sm"
          >
            {updateProfileMutation.isPending ? <Loader2 size={16} className="animate-spin"  strokeWidth={1.5} /> : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 animate-fade-up">
        {error && (
          <div className="mb-8 p-4 bg-lustre-rose/10 border border-lustre-rose/20 text-lustre-rose text-xs font-sans font-bold uppercase tracking-widest rounded-lg text-center">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Photos */}
          <div className="lg:col-span-5 space-y-8">
            <PhotoUploader photos={profile?.photos || []} />
          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Basic Info Card */}
              <Card className="p-8 md:p-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-lustre-purple">
                    <User size={18} strokeWidth={1.5} />
                    <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em]">Basic Info</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="ghost-mode" className="font-sans text-[9px] uppercase tracking-widest text-lustre-faint font-bold">Ghost Mode</label>
                    <Switch
                      id="ghost-mode"
                      checked={formData.ghostMode}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ghostMode: checked }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Display Name</label>
                    <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Alexander Rhodes" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                       <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold">Bio</label>
                       <span className="text-[10px] text-lustre-faint/50 font-sans font-medium">{formData.bio.length}/300</span>
                    </div>
                    <Textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Share your story..."
                      className="min-h-[100px] rounded-xl text-sm"
                      maxLength={300}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                       <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-purple font-bold">Ideal Sunday Prompt</label>
                       <span className="text-[10px] text-lustre-faint/50 font-sans font-medium">{formData.idealSunday.length}/150</span>
                    </div>
                    <Textarea 
                      name="idealSunday" 
                      value={formData.idealSunday} 
                      onChange={handleChange} 
                      placeholder="Describe your perfect Sunday..." 
                      className="min-h-[80px] bg-lustre-purple/5 border-lustre-purple/20 resize-none rounded-xl text-sm italic"
                      maxLength={150}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Age</label>
                      <Input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="28" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold">City</label>
                        <button
                          type="button"
                          onClick={handleShareLocation}
                          disabled={locating}
                          className="font-headline text-[9px] uppercase tracking-wider text-lustre-purple font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          {locating ? (
                            <Loader2 size={10} className="animate-spin text-lustre-purple" />
                          ) : (
                            <MapPin size={10} strokeWidth={2} />
                          )}
                          {locating ? "Locating..." : "Share Live Location"}
                        </button>
                      </div>
                      <Input name="city" value={formData.city} onChange={handleChange} placeholder="Nairobi" />
                       {formData.latitude != null ? (
                        <p className="text-[9px] text-[var(--success)] font-sans italic ml-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                          Live location active
                        </p>
                      ) : (
                        <p className="text-[9px] text-[var(--warning)] font-sans italic ml-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                          {locationError ? "Live location failed. Manual City fallback active." : "Manual City fallback active."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Relationship Preference</label>
                    <select
                      name="intent"
                      value={formData.intent}
                      onChange={(e) => setFormData(prev => ({ ...prev, intent: e.target.value }))}
                      className="w-full bg-white dark:bg-elevated border border-border-subtle text-lustre-text rounded-xl px-3 py-2.5 text-sm font-sans outline-none focus:border-lustre-purple/50 cursor-pointer"
                    >
                      <option value="unspecified">Unspecified / Friends</option>
                      <option value="relationship">Long-term Relationship</option>
                      <option value="dating">Dating</option>
                      <option value="casual">Casual Dating</option>
                      <option value="friendship">Friendship</option>
                      <option value="one_night">One-night Stand</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Matchmaking Card */}
              <Card className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3 text-lustre-purple">
                  <Settings size={18} strokeWidth={1.5} />
                  <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em]">Matchmaking</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Age Range Preference</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Min Age</span>
                        <select
                          name="minAge"
                          value={formData.minAge}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData(prev => ({ 
                              ...prev, 
                              minAge: val,
                              maxAge: prev.maxAge < val ? val : prev.maxAge
                            }));
                          }}
                          className="w-full bg-white dark:bg-elevated border border-border-subtle text-lustre-text rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-lustre-purple/50 cursor-pointer"
                        >
                          {Array.from({ length: 82 }, (_, i) => 18 + i).map(age => (
                            <option key={age} value={age}>{age}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Max Age</span>
                        <select
                          name="maxAge"
                          value={formData.maxAge}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setFormData(prev => ({ 
                              ...prev, 
                              maxAge: val,
                              minAge: prev.minAge > val ? val : prev.minAge
                            }));
                          }}
                          className="w-full bg-white dark:bg-elevated border border-border-subtle text-lustre-text rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-lustre-purple/50 cursor-pointer"
                        >
                          {Array.from({ length: 82 }, (_, i) => 18 + i).map(age => (
                            <option key={age} value={age}>{age}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Interested In</label>
                    <div className="bg-base rounded-full p-1 flex border border-border-subtle">
                       {['Men', 'Women', 'Everyone'].map((opt) => (
                         <button
                           key={opt}
                           type="button"
                           className={cn(
                             "flex-1 py-1.5 rounded-full font-sans text-[10px] font-bold uppercase tracking-widest transition-all",
                             formData.interestedIn.toLowerCase() === opt.toLowerCase()
                               ? "bg-lustre-purple text-[var(--primary-foreground)] shadow-[var(--shadow-card)]"
                               : "text-lustre-faint hover:text-lustre-muted"
                           )}
                           onClick={() => setFormData(prev => ({ ...prev, interestedIn: opt }))}
                         >
                           {opt}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Looking For (Relationship Intent)</label>
                    <select
                      name="intentPreference"
                      value={formData.intentPreference}
                      onChange={(e) => setFormData(prev => ({ ...prev, intentPreference: e.target.value }))}
                      className="w-full bg-white dark:bg-elevated border border-border-subtle text-lustre-text rounded-xl px-3 py-2.5 text-sm font-sans outline-none focus:border-lustre-purple/50 cursor-pointer"
                    >
                      <option value="unspecified">Unspecified / Any</option>
                      <option value="relationship">Long-term Relationship</option>
                      <option value="dating">Dating</option>
                      <option value="casual">Casual Dating</option>
                      <option value="friendship">Friendship</option>
                      <option value="one_night">One-night Stand</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center ml-1">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold">Preferred Distance</label>
                      <span className="text-xs font-sans text-lustre-text font-semibold">{formData.distance} km</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="150" 
                      name="distance"
                      value={formData.distance}
                      onChange={(e) => setFormData(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                      className="w-full accent-lustre-purple cursor-pointer bg-outline-variant/20 h-1.5 rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </Card>

              {/* Contact Details Card */}
              <Card className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3 text-lustre-purple">
                  <ShieldCheck size={18} strokeWidth={1.5} />
                  <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em]">Contact Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">WhatsApp Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lustre-faint">
                        <MessageCircle size={14}  strokeWidth={1.5} />
                      </div>
                      <Input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="pl-10" placeholder="+254 712 345678" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">Instagram Username</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lustre-faint">
                        <AtSign size={14}  strokeWidth={1.5} />
                      </div>
                      <Input name="instagram" value={formData.instagram} onChange={handleChange} className="pl-10" placeholder="@alex_rhodes" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payout Method Card */}
              <Card className="p-8 md:p-10 space-y-6">
                <div className="flex items-center gap-3 text-lustre-purple">
                  <Wallet size={18} strokeWidth={1.5} />
                  <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em]">Payout Method</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="font-sans text-xs text-lustre-muted italic leading-relaxed">
                    Choose how you receive referral earnings. Payments are processed via M-Pesa.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-lustre-faint font-bold ml-1">M-Pesa Number</label>
                    <div className="flex gap-2">
                      <div className="w-16 h-12 bg-base border border-border-subtle rounded-lg flex items-center justify-center font-sans text-xs font-bold text-lustre-muted">
                        +254
                      </div>
                      <Input 
                        name="whatsapp" 
                        value={formData.whatsapp} 
                        onChange={handleChange} 
                        placeholder="712 345 678" 
                        className="flex-1" 
                      />
                    </div>
                    <p className="text-[9px] text-lustre-faint font-sans italic ml-1">Syncing with WhatsApp number</p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 text-[9px] text-lustre-faint font-bold uppercase tracking-widest">
                    <ShieldCheck size={10}  strokeWidth={1.5} />
                    Payment data is encrypted and secure
                  </div>
                </div>
              </Card>

            </div>

            {/* Delete/Deactivate Section */}
            <div className="pt-12 border-t border-border-subtle flex justify-center">
              <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-[0.2em] text-lustre-rose/60 hover:text-lustre-rose hover:bg-lustre-rose/5 px-8 h-10 border border-lustre-rose/10 rounded-lg">
                Deactivate Account
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
