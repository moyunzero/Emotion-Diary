/**
 * 头部区：ProfileUserCard
 */

import { ProfileUserCard } from "@/components/Profile";

export type ProfileHeaderSectionProps = {
  avatarUri?: string;
  name?: string;
  handle: string | null;
  moodIcon?: React.ReactNode;
  isLoggedIn: boolean;
  onPress: () => void;
};

export function ProfileHeaderSection({
  avatarUri,
  name,
  handle,
  moodIcon,
  isLoggedIn,
  onPress,
}: ProfileHeaderSectionProps) {
  return (
    <ProfileUserCard
      avatarUri={avatarUri}
      name={name}
      handle={handle}
      moodIcon={moodIcon}
      isLoggedIn={isLoggedIn}
      onPress={onPress}
    />
  );
}
