type InitialAvatarProps = {
  name?: string | null;
  className?: string;
  textClassName?: string;
};

function getInitial(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "B";
  return (trimmed[0] ?? "B").toLocaleUpperCase("tr-TR");
}

export function InitialAvatar(props: InitialAvatarProps) {
  return (
    <div
      className={[
        "flex items-center justify-center rounded-full bg-linear-to-br from-[#83aeff] to-[#00fdc6]",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Profile avatar"
    >
      <span className={props.textClassName ?? "font-bold text-[#0c0e17]"}>
        {getInitial(props.name)}
      </span>
    </div>
  );
}
