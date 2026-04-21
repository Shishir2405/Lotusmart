import Link from "next/link";
import { RiFileTextLine, RiArrowRightLine } from "react-icons/ri";

interface PolicyEmptyStateProps {
  pageLabel: string;
  contactEmail?: string;
}

export function PolicyEmptyState({ pageLabel, contactEmail }: PolicyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#FFF1F3", border: "1px solid #FECDD3" }}
      >
        <RiFileTextLine size={22} style={{ color: "#E84672" }} />
      </div>
      <h2 className="mb-2 text-lg font-bold tracking-tight text-neutral-800">
        {pageLabel} is being prepared
      </h2>
      <p
        className="mb-6 max-w-md text-[0.88rem] leading-relaxed font-medium"
        style={{ color: "#a8a29e" }}
      >
        Our team is finalising this content. Once published from the admin
        panel, it will appear here automatically.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[0.78rem] font-bold text-white"
          style={{ backgroundColor: "#E84672" }}
        >
          Contact us
          <RiArrowRightLine size={13} />
        </Link>
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            className="text-[0.78rem] font-semibold underline underline-offset-2"
            style={{ color: "#E84672" }}
          >
            {contactEmail}
          </a>
        )}
      </div>
    </div>
  );
}
