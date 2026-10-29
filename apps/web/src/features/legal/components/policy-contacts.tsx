import { Reveal } from '@/components/common/reveal';

interface PolicyContactsProps {
  id: string;
  title: string;
  description: string;
  operatorLabel: string;
  operator: string;
  emailLabel: string;
  email: string;
  addressLabel: string;
  address: string;
  hostingLabel: string;
  hosting: string;
  authorityTitle: string;
  authorityText: string;
  authorityLinkLabel: string;
  authorityUrl: string;
}

// Placeholders in the dictionary look like "[...]", so they never match and stay plain text.
const EMAIL_PATTERN = /^[^\s@[\]]+@[^\s@[\]]+\.[^\s@[\]]+$/;

const LINK_CLASS =
  'text-foreground focus-visible:ring-ring hover:text-primary rounded-sm font-medium underline underline-offset-4 transition-colors outline-none focus-visible:ring-2';

/** Closing card of a policy page: operator details and the supervisory authority. */
export function PolicyContacts(props: PolicyContactsProps) {
  const headingId = `${props.id}-title`;
  const rows = [
    { label: props.operatorLabel, value: props.operator },
    { label: props.emailLabel, value: props.email },
    { label: props.addressLabel, value: props.address },
    { label: props.hostingLabel, value: props.hosting },
  ];

  return (
    <Reveal>
      <section
        id={props.id}
        aria-labelledby={headingId}
        className="bg-card flex scroll-mt-28 flex-col gap-6 rounded-3xl p-6 md:p-10"
      >
        <div className="flex flex-col gap-3">
          <h2 id={headingId} className="text-h2 text-foreground">
            {props.title}
          </h2>
          <p className="text-body-md text-text-secondary">{props.description}</p>
        </div>

        <dl className="bg-surface-soft grid gap-x-8 gap-y-4 rounded-2xl p-5 md:grid-cols-2 md:p-6">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <dt className="text-body-sm text-text-secondary font-medium uppercase">
                {row.label}
              </dt>
              <dd className="text-body-md text-foreground break-words">
                {EMAIL_PATTERN.test(row.value) ? (
                  <a href={`mailto:${row.value}`} className={LINK_CLASS}>
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2">
          <h3 className="text-h3 text-foreground">{props.authorityTitle}</h3>
          <p className="text-body-md text-text-secondary">
            {props.authorityText}{' '}
            <a
              href={props.authorityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {props.authorityLinkLabel}
            </a>
          </p>
        </div>
      </section>
    </Reveal>
  );
}
