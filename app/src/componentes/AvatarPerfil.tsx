import { obterAvatarPerfil } from "@/app/src/lib/avataresPerfil";

type Props = {
  avatarId?: string | null;
  className?: string;
  decorativo?: boolean;
};

export default function AvatarPerfil({
  avatarId,
  className = "",
  decorativo = false,
}: Props) {
  const avatar = obterAvatarPerfil(avatarId);

  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      role={decorativo ? undefined : "img"}
      aria-label={decorativo ? undefined : `Avatar ${avatar.nome}`}
      aria-hidden={decorativo || undefined}
      focusable="false"
    >
      <circle cx="40" cy="40" r="40" fill={avatar.fundo} />

      {avatar.penteado === 3 && (
        <path d="M19 38c0-15 9-24 21-24s21 9 21 24v24H19z" fill={avatar.cabelo} />
      )}
      {avatar.penteado === 4 && (
        <path d="M19 39c0-16 9-25 21-25s21 9 21 25v23H19z" fill={avatar.cabelo} />
      )}

      <path d="M14 80c2-15 11-22 26-22s24 7 26 22" fill={avatar.roupa} />
      <path d="M33 53h14v12H33z" fill={avatar.pele} />
      <path d="m31 62 9 8 9-8" fill="#FFFFFF" fillOpacity=".75" />

      <ellipse cx="22" cy="39" rx="4" ry="6" fill={avatar.pele} />
      <ellipse cx="58" cy="39" rx="4" ry="6" fill={avatar.pele} />
      <ellipse cx="40" cy="39" rx="17" ry="21" fill={avatar.pele} />

      {avatar.penteado === 0 && (
        <path d="M23 36c-2-15 5-24 17-24s20 9 17 24c-4-5-7-8-12-9-5 5-12 8-22 9z" fill={avatar.cabelo} />
      )}
      {avatar.penteado === 1 && (
        <path d="M22 38c-3-15 5-26 18-26 14 0 21 11 18 26-4-9-10-12-17-12-6 7-12 10-19 12z" fill={avatar.cabelo} />
      )}
      {avatar.penteado === 2 && (
        <>
          <path d="M22 37c-2-15 6-25 18-25s20 10 18 25c-5-5-10-7-17-7s-13 2-19 7z" fill={avatar.cabelo} />
          {[26, 33, 40, 47, 54].map((cx) => (
            <circle key={cx} cx={cx} cy="18" r="6" fill={avatar.cabelo} />
          ))}
          <circle cx="23" cy="25" r="5" fill={avatar.cabelo} />
          <circle cx="57" cy="25" r="5" fill={avatar.cabelo} />
        </>
      )}
      {avatar.penteado === 3 && (
        <path d="M20 40c-4-16 3-28 20-28s24 12 20 28l-6-4-3-12c-7 6-15 8-25 7l-2 9z" fill={avatar.cabelo} />
      )}
      {avatar.penteado === 4 && (
        <>
          <circle cx="40" cy="13" r="8" fill={avatar.cabelo} />
          <path d="M22 38c-2-16 5-26 18-26s20 10 18 26c-4-7-9-10-17-10s-14 3-19 10z" fill={avatar.cabelo} />
        </>
      )}

      <ellipse cx="33" cy="40" rx="1.7" ry="2.2" fill="#34251F" />
      <ellipse cx="47" cy="40" rx="1.7" ry="2.2" fill="#34251F" />
      <path d="M37 49c2 2 4 2 6 0" fill="none" stroke="#8A4F47" strokeWidth="1.8" strokeLinecap="round" />

      {avatar.oculos && (
        <g fill="none" stroke="#26364A" strokeWidth="2">
          <circle cx="33" cy="40" r="5" />
          <circle cx="47" cy="40" r="5" />
          <path d="M38 40h4" />
        </g>
      )}
    </svg>
  );
}
