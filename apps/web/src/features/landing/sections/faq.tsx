import { Container } from '@/components/common/container';
import { Reveal } from '@/components/common/reveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SECTION_IDS } from '@/features/site/constants';
import { t } from '@/locales';

export function Faq() {
  const { title, items } = t.landing.faq;

  return (
    <section id={SECTION_IDS.faq} className="scroll-mt-28">
      <Container className="flex flex-col gap-6">
        <Reveal>
          <h2 className="text-h2 text-foreground">{title}</h2>
        </Reveal>
        <Reveal delay={100}>
          <Accordion type="single" collapsible className="flex flex-col gap-2">
            {items.map((item, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-card rounded-2xl border-b-0 px-6 last:border-b-0"
              >
                <AccordionTrigger className="text-h3 text-foreground items-center py-6 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-body-md text-text-secondary pb-6">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </Container>
    </section>
  );
}
