/**
 * Schakelaar (aan/uit), zoals in het ontwerp: 44 × 26, zwart met witte knop als hij aan staat.
 * Een echte knop met role="switch", dus bruikbaar met toetsenbord en schermlezer.
 */
export default function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`relative shrink-0 w-11 h-[26px] rounded-full transition-colors duration-200 disabled:opacity-40 ${checked ? 'bg-ink' : 'bg-[#d9d9d9]'}`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`absolute top-[3px] size-5 rounded-full bg-white transition-[left] duration-200 ease-soft ${checked ? 'left-[21px]' : 'left-[3px]'}`}
        aria-hidden="true"
      />
    </button>
  );
}
