/**
 * 头部区：ProfileHeader、ProfileUserCard
 */

import { ProfileHeader, ProfileUserCard } from "@/components/Profile";

export type ProfileHeaderSectionProps = {
  onBack: () => void;
  avatarUri?: string;
  name?: string;
  handle: string | null;
  moodIcon?: React.ReactNode;
  isLoggedIn: boolean;
  onPress: () => void;
};

export function ProfileHeaderSection({
  onBack,
  avatarUri,
  name,
  handle,
  moodIcon,
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
        moodIcon={moodIcon}
        isLoggedIn={isLoggedIn}
        onPress={onPress}
      />
    </>
  );
}
