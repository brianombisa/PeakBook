import { CompanyProfile } from '@/api/entities';
import { PeakPointLedger } from '@/api/entities';
import { User } from '@/api/entities';

export const PointService = {
  awardPoints: async (reason, points, entityType = null, entityId = null) => {
    try {
      const user = await User.me();
      const profiles = await CompanyProfile.filter({ created_by: user.email });
      if (profiles.length === 0) {
        console.error("No company profile found for user to award points.");
        return;
      }
      
      const profile = profiles[0];
      const newBalance = (profile.peak_points_balance || 0) + points;

      await CompanyProfile.update(profile.id, {
        peak_points_balance: newBalance,
      });

      await PeakPointLedger.create({
        user_id: user.id,
        points_earned: points,
        reason: reason,
        related_entity_type: entityType,
        related_entity_id: entityId,
      });

      console.log(`Awarded ${points} points to ${user.email} for: ${reason}. New balance: ${newBalance}`);
      
      return true;
    } catch (error) {
      console.error("Failed to award points:", error);
      return false;
    }
  },
};