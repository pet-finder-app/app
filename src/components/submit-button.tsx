type SubmitButtonProps = {
  isSubmitting: boolean;
  label: string;
  loadingLabel: string;
};

export function SubmitButton({
  isSubmitting,
  label,
  loadingLabel,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className="mt-3 w-full rounded-lg bg-brand py-3.5 text-sm font-bold tracking-wide text-black transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-brand focus-visible:outline-none disabled:opacity-60"
    >
      {isSubmitting ? loadingLabel : label}
    </button>
  );
}
