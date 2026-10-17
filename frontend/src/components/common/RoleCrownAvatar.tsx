import { ROLE_CROWN } from "@/src/constants/shared/common";
type RoleCrownAvatarProps = {
  role: string;
};

export default function RoleCrownAvatar({ role }: RoleCrownAvatarProps) {
  const tier = role === "owner" ? "gold" : role === "manager" ? "silver" : "bronze";
  const label = role === "owner" ? ROLE_CROWN.owner : role === "manager" ? ROLE_CROWN.manager : ROLE_CROWN.staff;

  return (
    <span className={`admin-user-avatar role-crown-avatar is-${tier}`} role="img" aria-label={label}>
      <span className="role-crown-avatar-crown" aria-hidden="true">♛</span>
      <span className="role-crown-avatar-person" aria-hidden="true"><i /><b /></span>
    </span>
  );
}
