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
      {avatar.penteado === 5 && (
        <path d="M18 45c-5-23 5-37 22-37s27 14 22 37l-4 32h-9l2-32H29l2 32h-9z" fill={avatar.cabelo} />
      )}
      {avatar.penteado === 6 && (
        <>
          <path d="M15 43c-6-20 4-36 25-36s31 16 25 36l-7 12H22z" fill={avatar.cabelo} />
          {[19, 28, 37, 46, 55, 24, 42, 60].map((cx, index) => (
            <circle key={index} cx={cx} cy={index < 5 ? 17 : 26} r="7" fill={avatar.cabelo} />
          ))}
        </>
      )}
      {avatar.penteado === 7 && (
        <>
          <path d="M20 40c-4-17 4-29 20-29s24 12 20 29l-7-5-2-12c-7 7-16 9-28 8z" fill={avatar.cabelo} />
          <path d="M56 35c8 8 6 19 1 25s-2 12 2 17" fill="none" stroke={avatar.cabelo} strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      {avatar.penteado === 8 && (
        <path d="M17 43C13 20 25 7 40 7s27 13 23 36l-5 21c-6 10-13 14-18 16-5-2-12-6-18-16z" fill={avatar.roupa} />
      )}
      {avatar.penteado === 9 && (
        <path d="M21 39c-3-17 4-28 19-28s22 11 19 28l-6-5-2-11c-8 7-16 9-27 8z" fill={avatar.cabelo} />
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
      {avatar.penteado === 5 && (
        <path d="M22 36c-2-17 5-25 18-25s20 8 18 25c-6-8-12-11-18-11s-12 3-18 11z" fill={avatar.cabelo} />
      )}
      {avatar.penteado === 6 && (
        <>
          <path d="M21 37c-3-17 5-26 19-26s22 9 19 26c-6-8-12-11-19-11s-13 3-19 11z" fill={avatar.cabelo} />
          {[27, 35, 43, 51].map((cx) => (
            <circle key={cx} cx={cx} cy="15" r="6" fill={avatar.cabelo} />
          ))}
        </>
      )}
      {avatar.penteado === 7 && (
        <>
          <path d="M21 37c-3-17 5-26 19-26s22 9 19 26c-5-7-12-10-19-10s-14 3-19 10z" fill={avatar.cabelo} />
          {[27, 34, 41, 48, 55].map((cx) => (
            <circle key={cx} cx={cx} cy="15" r="3" fill={avatar.cabelo} />
          ))}
        </>
      )}
      {avatar.penteado === 8 && (
        <path d="M21 37c-2-16 6-26 19-26s21 10 19 26l-7-5c0-10-4-15-12-15s-12 5-12 15z" fill={avatar.roupa} />
      )}
      {avatar.penteado === 9 && (
        <>
          <path d="M22 37c-2-16 5-25 18-25s20 9 18 25c-5-6-11-9-18-9s-13 3-18 9z" fill={avatar.cabelo} />
          {[27, 34, 41, 48, 55].map((cx) => (
            <circle key={cx} cx={cx} cy="16" r="4" fill={avatar.cabelo} />
          ))}
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