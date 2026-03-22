/**
 * 头部区：ProfileHeader、ProfileUserCard
 */

import { ProfileHeader, ProfileUserCard } from "@/components/Profile";

export type ProfileHeaderSectionProps = {
  onBack: () => void;
  avatarUri?: string;
  name?: string;
  handle: string | null;
  moodText?: string;
  isLoggedIn: boolean;
  onPress: () => void;
};

export function ProfileHeaderSection({
  onBack,
  avatarUri,
  name,
  handle,
  moodText,
  isLoggedIn,
  onPress,
}: ProfileHeaderSectionProps) {
  return (
    <>
      <ProfileHeader onBack={onBack} />
      <ProfileUserCard
        avatarUri={avatarUri}
        name={name}
        handle={handle}
        moodText={moodText}
        isLoggedIn={isLoggedIn}
        onPress={onPress}
      />
    </>
  );
}
