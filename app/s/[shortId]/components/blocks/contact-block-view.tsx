import { Block } from '@/shared/types'
import { contactLink, contactPeople } from '@/shared/block-data'
import { Button } from '@/components/ui/button'

/** «Контакты»: буква-аватар, имя, кто это и «Написать». */
export function ContactBlockView({ block }: { block: Block }) {
  const people = contactPeople(block.data)
  if (!people.length) return null
  return <div className="space-y-4">
    {people.map((person, i) => {
      const link = contactLink(person)
      return <div key={i} className="flex items-center gap-4">
        <span className="heading flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-title-xs font-extrabold text-primary" aria-hidden>
          {person.name.trim().charAt(0).toLocaleUpperCase('ru') || '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{person.name}</p>
          {person.role && <p className="text-body-sm text-muted-foreground">{person.role}</p>}
        </div>
        {link && <Button variant="outline" asChild><a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">Написать</a></Button>}
      </div>
    })}
  </div>
}
