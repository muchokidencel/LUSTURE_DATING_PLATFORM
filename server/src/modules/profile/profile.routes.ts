import { Router } from 'express';
import { db } from '../../db/index.js';
import { profiles, photos, users, userPreferences } from '../../db/schema.js';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { profileUpdateSchema } from '../../shared/schemas.js';
import { syncUserPremiumStatus } from '../../middleware/sync-premium.js';
import multer from 'multer';
import cloudinary from '../../config/cloudinary.js';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  console.log(`[PROFILE:READ] Fetching profile for User: ${userId}`);
  try {
    // Sync tier
    const premiumTier = await syncUserPremiumStatus(userId);

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const normalizePhotos = (photos: any) => {
      if (!photos) return [];
      const arr = Array.isArray(photos) ? photos : [photos];
      return arr.map(p => typeof p === 'string' ? JSON.parse(p) : p);
    };

    const finalPhotos = normalizePhotos(user?.photos);
    console.log(`[PHOTO:SERVE:OWN_PROFILE] userId=${userId}, photoCount=${finalPhotos.length}`);

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    const age = profile?.birthDate ? Math.floor((new Date().getTime() - new Date(profile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 18;

    const userPhotos = await db.query.photos.findMany({
      where: eq(photos.userId, userId),
    });

    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    res.json({
      status: 'success',
      data: {
        ...profile,
        whatsapp: user?.whatsapp || profile?.whatsappNumber || '',
        instagram: user?.instagram || profile?.instagramUsername || '',
        photos: finalPhotos,
        age,
        premiumTier,
        photosTable: userPhotos,
        preferences
      }
    });

  } catch (error) {
    console.error(`[PROFILE:READ] Error for User ${userId}:`, error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Photo Upload
router.post('/photos', authenticate, upload.single('photo'), async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const file = req.file;

  console.log(`[PHOTO:UPLOAD:REQUEST] userId=${userId}, filename=${file?.originalname}, size=${file?.size}, mimetype=${file?.mimetype}`);

  if (!file) {
    console.warn(`[PHOTO:UPLOAD:VALIDATION_FAILED] No file provided for user ${userId}`);
    return res.status(400).json({ message: 'No photo provided' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    console.warn(`[PHOTO:UPLOAD:VALIDATION_FAILED] Invalid type ${file.mimetype} for user ${userId}`);
    return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, and WEBP allowed.' });
  }

  try {
    console.log(`[PHOTO:UPLOAD:DB_CHECK] Fetching current photos for user ${userId}`);
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const currentPhotos = (user?.photos as any[]) || [];
    if (currentPhotos.length >= 6) {
      console.warn(`[PHOTO:UPLOAD:LIMIT_REACHED] User ${userId} already has 6 photos`);
      return res.status(400).json({ message: 'Maximum of 6 photos allowed' });
    }

    // Upload to Cloudinary
    console.log(`[PHOTO:UPLOAD:CLOUDINARY_START] Starting stream upload for user ${userId}`);
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `lustre/profile-photos/${userId}`,
          transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
          allowed_formats: ['jpg', 'png', 'webp'],
        },
        (error, result) => {
          if (error) {
            console.error(`[PHOTO:UPLOAD:CLOUDINARY_ERROR] user ${userId}:`, error);
            reject(error);
          }
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    }) as any;

    console.log(`[PHOTO:UPLOAD:SUCCESS] userId=${userId}, public_id=${result.public_id}, url=${result.secure_url}`);

    const newPhoto = { url: result.secure_url, public_id: result.public_id };
    const updatedPhotos = [...currentPhotos, newPhoto];

    console.log(`[PHOTO:UPLOAD:DB_UPDATE] Saving new photos array to DB for user ${userId}`);
    await db.update(users)
      .set({ photos: updatedPhotos })
      .where(eq(users.id, userId));

    // Update photo count in profiles
    await db.update(profiles)
      .set({ photoCount: updatedPhotos.length })
      .where(eq(profiles.userId, userId));

    console.log(`[PHOTO:UPLOAD:COMPLETE] User ${userId} now has ${updatedPhotos.length} photos`);
    res.json({ status: 'success', data: updatedPhotos });
  } catch (error: any) {
    console.error(`[PHOTO:UPLOAD:ERROR] userId=${userId}, message=${error.message}, stack=${error.stack}`);
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// Photo Delete
router.delete('/photos', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { public_id } = req.body;

  console.log(`[PHOTO:DELETE:REQUEST] userId=${userId}, public_id=${public_id}`);

  if (!public_id) {
    console.warn(`[PHOTO:DELETE:VALIDATION_FAILED] No public_id provided by user ${userId}`);
    return res.status(400).json({ message: 'public_id is required' });
  }

  // Verify public_id belongs to user
  if (!public_id.includes(`lustre/profile-photos/${userId}`)) {
    console.warn(`[PHOTO:DELETE:UNAUTHORIZED] User ${userId} tried to delete public_id ${public_id}`);
    return res.status(403).json({ message: 'Unauthorized to delete this photo' });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const currentPhotos = (user?.photos as any[]) || [];
    const photoToDelete = currentPhotos.find(p => p.public_id === public_id);

    if (!photoToDelete) {
      console.warn(`[PHOTO:DELETE:NOT_FOUND] public_id ${public_id} not in user ${userId} profile`);
      return res.status(404).json({ message: 'Photo not found in profile' });
    }

    // Delete from Cloudinary
    console.log(`[PHOTO:DELETE:CLOUDINARY_START] Destroying public_id ${public_id}`);
    await cloudinary.uploader.destroy(public_id);

    const updatedPhotos = currentPhotos.filter(p => p.public_id !== public_id);

    console.log(`[PHOTO:DELETE:DB_UPDATE] Removing photo from DB for user ${userId}`);
    await db.update(users)
      .set({ photos: updatedPhotos })
      .where(eq(users.id, userId));

    // Update photo count in profiles
    await db.update(profiles)
      .set({ photoCount: updatedPhotos.length })
      .where(eq(profiles.userId, userId));

    console.log(`[PHOTO:DELETE:SUCCESS] userId=${userId}, remaining=${updatedPhotos.length}`);
    res.json({ status: 'success', data: updatedPhotos });
  } catch (error: any) {
    console.error(`[PHOTO:DELETE:ERROR] userId=${userId}, message=${error.message}`);
    res.status(500).json({ message: 'Error deleting photo' });
  }
});

router.put('/', authenticate, validate(profileUpdateSchema), async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { displayName, age, gender, city, bio, matchPreferences, whatsapp, instagram, ghostMode, idealSunday, latitude, longitude, intent } = req.body;

  console.log(`[PROFILE:UPDATE:REQUEST] userId=${userId}, fields=${Object.keys(req.body).join(', ')}`);

  try {
    // 1. Update User Table (Contact Details & Ghost Mode)
    const userUpdate: any = {};
    const profileUpdate: any = {};

    if (whatsapp !== undefined) {
      // Strip common phone-number formatting (spaces, dashes, dots, parens)
      // before validating -- users type/paste numbers in all sorts of ways
      // ("0712-345-678", "(071) 234 5678"), and only the digits/leading "+"
      // actually matter once stored.
      const cleanWhatsapp = whatsapp.replace(/[\s\-().]+/g, '');
      if (cleanWhatsapp && !/^\+?\d{7,15}$/.test(cleanWhatsapp)) {
        return res.status(400).json({ message: 'Invalid WhatsApp number format' });
      }
      userUpdate.whatsapp = cleanWhatsapp || null;
      profileUpdate.whatsappNumber = cleanWhatsapp || null;
    }
    if (instagram !== undefined) {
      const cleanInstagram = instagram.replace(/^@/, '').substring(0, 30);
      userUpdate.instagram = cleanInstagram || null;
      profileUpdate.instagramUsername = cleanInstagram || null;
    }
    if (ghostMode !== undefined) {
      userUpdate.ghostMode = ghostMode;
    }

    if (Object.keys(userUpdate).length > 0) {
      await db.update(users).set(userUpdate).where(eq(users.id, userId));
      console.log(`[PROFILE:UPDATE:USER] userId=${userId}, updated=${Object.keys(userUpdate).join(', ')}`);
    }

    // 2. Update Profile Table
    if (displayName !== undefined) profileUpdate.fullName = displayName;
    if (bio !== undefined) profileUpdate.bio = bio;
    if (idealSunday !== undefined) profileUpdate.idealSunday = idealSunday;
    if (gender !== undefined) {
      const genderMap: any = {
        'Male': 'male',
        'Female': 'female',
        'Non-binary': 'non_binary',
        'Prefer not to say': 'other'
      };
      profileUpdate.gender = genderMap[gender] || gender.toLowerCase();
    }
    if (city !== undefined) profileUpdate.location = city;
    if (latitude !== undefined) profileUpdate.latitude = latitude;
    if (longitude !== undefined) profileUpdate.longitude = longitude;
    if (intent !== undefined) profileUpdate.intent = intent;
    if (age !== undefined) {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - age);
      birthDate.setMonth(0);
      birthDate.setDate(1);
      profileUpdate.birthDate = birthDate;
    }

    // Update profile (upsert)
    if (Object.keys(profileUpdate).length > 0) {
      await db.insert(profiles)
        .values({
          userId,
          ...profileUpdate,
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: profileUpdate,
        });
    }

    // Update matchPreferences
    if (matchPreferences) {
      const { gender: prefGender, ageRange, city: prefCity, maxDistanceKm, intent: prefIntent } = matchPreferences;
      
      const genderMap: any = {
        'Male': ['male'],
        'Female': ['female'],
        'Both': ['male', 'female'],
        'Any': ['male', 'female', 'non_binary', 'other']
      };

      const prefUpdate: any = {
        interestedInGenders: genderMap[prefGender] || [prefGender.toLowerCase()],
        minAge: ageRange.min,
        maxAge: ageRange.max,
      };

      if (maxDistanceKm !== undefined) {
        prefUpdate.maxDistanceKm = maxDistanceKm;
      }

      if (prefIntent !== undefined) {
        prefUpdate.intentPreference = prefIntent;
      }

      await db.insert(userPreferences)
        .values({
          userId,
          ...prefUpdate,
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: prefUpdate,
        });
    }

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        profile: true,
        preferences: true,
      }
    });

    console.log(`[PROFILE:UPDATE:SUCCESS] userId=${userId}`);
    res.json({
      status: 'success',
      data: updatedUser
    });
  } catch (error: any) {
    console.error(`[PROFILE:UPDATE:ERROR] userId=${userId}, error=${error.message}`);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});


router.patch('/location', authenticate, async (req: AuthRequest, res) => {
  const locationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    city: z.string().optional().nullable(),
  });

  const validation = locationSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: validation.error.errors,
    });
  }

  const { latitude, longitude, city } = validation.data;
  const userId = req.user!.id;

  try {
    const updatePayload = {
      latitude,
      longitude,
      location: city || null,
      locationUpdatedAt: new Date(),
    };

    await db.insert(profiles)
      .values({
        userId,
        ...updatePayload,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: updatePayload,
      });

    res.json({
      success: true,
      location: {
        latitude,
        longitude,
        city: city || null,
      },
    });
  } catch (error: any) {
    console.error(`[PROFILE:LOCATION:UPDATE:ERROR] userId=${userId}, error=${error.message}`);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
});

router.patch('/me', authenticate, validate(profileUpdateSchema), async (req: AuthRequest, res) => {
  return res.status(405).json({ message: 'Method not allowed. Use PUT /api/profile' });
});

router.put('/me', authenticate, validate(profileUpdateSchema), async (req: AuthRequest, res) => {
  return res.status(405).json({ message: 'Method not allowed. Use PUT /api/profile' });
});

export default router;
